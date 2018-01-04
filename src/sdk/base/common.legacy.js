/*global adapter, attachMediaStream:true*/

/*
 * Woogeen.Common provides common functions for WooGeen SDK
 */
Woogeen.Common = (function() {

  var sdkVersion = '3.5';

  // Convert W3C defined statistic data to SDK format.
  var parseStats = function(stats) {
    'use strict';
    var index = 0;
    var statusReport = [];
    if (navigator.mozGetUserMedia) { // Firefox, unsupported properties return -1 or ""
      stats.forEach(function(stat, id) {
        var curStat;
        var match = false;
        if (id.indexOf("outbound_rtp_audio_") >= 0) {
          match = true;
          curStat = {
            "type": "ssrc_audio_send",
            "id": stat.id,
            "stats": {
              "bytes_sent": stat.bytesSent,
              "codec_name": "",
              "packets_sent": stat.packetsSent,
              "packets_lost": stats.get("outbound_rtcp_audio_" + id
                .slice(19)).packetsLost,
              "rtt_ms": stats.get("outbound_rtcp_audio_" + id.slice(
                19)).mozRtt
            }
          };
        } else if (id.indexOf("outbound_rtp_video_") >= 0) {
          match = true;
          curStat = {
            "type": "ssrc_video_send",
            "id": stat.id,
            "stats": {
              "bytes_sent": stat.bytesSent,
              "codec_name": "",
              "packets_sent": stat.packetsSent,
              "packets_lost": stats.get("outbound_rtcp_video_" + id
                .slice(19)).packetsLost,
              "firs_rcvd": -1,
              "plis_rcvd": -1,
              "nacks_rcvd": -1,
              "send_frame_width": -1,
              "send_frame_height": -1,
              "adapt_reason": -1,
              "adapt_changes": -1,
              "framerate_sent": stat.framerateMean,
              "rtt_ms": stats.get("outbound_rtcp_video_" + id.slice(
                19)).mozRtt
            }
          };
        } else if (id.indexOf("inbound_rtp_audio_") >= 0) {
          match = true;
          curStat = {
            "type": "ssrc_audio_recv",
            "id": stat.id,
            "stats": {
              "bytes_rcvd": stat.bytesReceived,
              "delay_estimated_ms": -1,
              "packets_rcvd": stat.packetsReceived,
              "packets_lost": stat.packetsLost,
              "codec_name": ""
            }
          };
        } else if (id.indexOf("inbound_rtp_video_") >= 0) {
          match = true;
          curStat = {
            "type": "ssrc_video_recv",
            "id": stat.id,
            "stats": {
              "bytes_rcvd": stat.bytesReceived,
              "packets_rcvd": stat.packetsReceived,
              "packets_lost": stat.packetsLost,
              "firs_sent": -1,
              "nacks_sent": -1,
              "plis_sent": -1,
              "frame_width": -1,
              "frame_height": -1,
              "framerate_rcvd": stat.framerateMean,
              "framerate_output": -1,
              "current_delay_ms": -1,
              "codec_name": ""
            }
          };
        }
        if (match) {
          statusReport[index] = curStat;
          index++;
        }
      });
    } else {
      stats.forEach(function(res) {
        var curStat;
        var match = false;
        if (res.type === "ssrc") {
          // This is a ssrc report. Check if it is send/recv
          match = true;
          if (res.bytesSent) {
            // check if it"s audio or video
            if (res.googFrameHeightSent) {
              // video send
              var adaptReason;
              if (res.googCpuLimitedResolution === true) {
                adaptReason = 1;
              } else if (res.googBandwidthLimitedResolution === true) {
                adaptReason = 2;
              } else if (res.googViewLimitedResolution === true) {
                adaptReason = 3;
              } else {
                adaptReason = 99;
              }
              curStat = {
                "type": "ssrc_video_send",
                "id": res.id,
                "stats": {
                  "bytes_sent": res.bytesSent,
                  "codec_name": res.googCodecName,
                  "packets_sent": res.packetsSent,
                  "packets_lost": res.packetsLost,
                  "firs_rcvd": res.googFirsReceived,
                  "plis_rcvd": res.googPlisReceived,
                  "nacks_rcvd": res.googNacksReceived,
                  "send_frame_width": res.googFrameWidthSent,
                  "send_frame_height": res.googFrameHeightSent,
                  "adapt_reason": adaptReason,
                  "adapt_changes": res.googAdaptationChanges,
                  "framerate_sent": res.googFrameRateSent,
                  "rtt_ms": res.googRtt
                }
              };
            } else {
              // audio send
              curStat = {
                "type": "ssrc_audio_send",
                "id": res.id,
                "stats": {
                  "bytes_sent": res.bytesSent,
                  "codec_name": res.googCodecName,
                  "packets_sent": res.packetsSent,
                  "packets_lost": res.packetsLost,
                  "rtt_ms": res.googRtt
                }
              };
            }
          } else {
            // this is ssrc receive report.
            if (res.googFrameHeightReceived) {
              // video receive
              curStat = {
                "type": "ssrc_video_recv",
                "id": res.id,
                "stats": {
                  "bytes_rcvd": res.bytesReceived,
                  "packets_rcvd": res.packetsReceived,
                  "packets_lost": res.packetsLost,
                  "firs_sent": res.googFirsSent,
                  "nacks_sent": res.googNacksSent,
                  "plis_sent": res.googPlisSent,
                  "frame_width": res.googFrameWidthReceived,
                  "frame_height": res.googFrameHeightReceived,
                  "framerate_rcvd": res.googFrameRateReceived,
                  "framerate_output": res.googFrameRateDecoded,
                  "current_delay_ms": res.googCurrentDelayMs,
                  "codec_name": res.googCodecName
                }
              };
            } else {
              // audio receive
              curStat = {
                "type": "ssrc_audio_recv",
                "id": res.id,
                "stats": {
                  "bytes_rcvd": res.bytesReceived,
                  "delay_estimated_ms": res.googCurrentDelayMs,
                  "packets_rcvd": res.packetsReceived,
                  "packets_lost": res.packetsLost,
                  "codec_name": res.googCodecName
                }
              };
            }
          }
        } else if (res.type === "VideoBwe") {
          match = true;
          curStat = {
            "type": "VideoBWE",
            "id": "",
            "stats": {
              "available_send_bandwidth": res.googAvailableSendBandwidth,
              "available_receive_bandwidth": res.googAvailableReceiveBandwidth,
              "transmit_bitrate": res.googTransmitBitrate,
              "retransmit_bitrate": res.googRetransmitBitrate
            }
          };
        }
        if (match) {
          statusReport[index] = curStat;
          index++;
        }
      });
    }
    return statusReport;
  };

  var parseAudioLevel = function(stats) {
    var inLevelIdx = 0;
    var outLevelIdx = 0;
    var stats_Report = {};
    var curInputLevels = [];
    var curOutputLevels = [];
    var match = false;
    var results = stats.result();
    for (var i = 0; i < results.length; i++) {
      var res = results[i];
      if (res.type === "ssrc") {
        //This is a ssrc report. Check if it is send/recv
        if (res.stat("bytesSent")) {
          //check if it"s audio or video
          if (res.stat("googFrameHeightSent")) {
            //video send, not setting audio levels
          } else {
            //audio send
            match = true;
            var curObj = {};
            curObj.ssrc = res.id;
            curObj.level = res.stat("audioInputLevel");
            curInputLevels[inLevelIdx] = curObj;
            inLevelIdx++;
          }
        } else {
          //this is ssrc receive report.
          if (res.stat("googFrameHeightReceived")) {
            //video receive
          } else {
            //audio receive
            match = true;
            var curObj = {}; /*jshint ignore:line*/
            curObj.ssrc = res.id;
            curObj.level = res.stat("audioOutputLevel");
            curOutputLevels[outLevelIdx] = curObj;
            outLevelIdx++;
          }
        }
      }
    }
    if (match) {
      if (inLevelIdx > 0) {
        stats_Report.audioInputLevels = curInputLevels;
      }
      if (outLevelIdx > 0) {
        stats_Report.audioOutputLevels = curOutputLevels;
      }
    }
    return stats_Report;
  };

  /* Following functions are copied from apprtc with modifications */

  // Find the line in sdpLines that starts with |prefix|, and, if specified,
  // contains |substr| (case-insensitive search).
  function findLine(sdpLines, prefix, substr) {
    return findLineInRange(sdpLines, 0, -1, prefix, substr);
  }

  // Find the line in sdpLines[startLine...endLine - 1] that starts with |prefix|
  // and, if specified, contains |substr| (case-insensitive search).
  function findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
    var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
    for (var i = startLine; i < realEndLine; ++i) {
      if (sdpLines[i].indexOf(prefix) === 0) {
        if (!substr ||
          sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
          return i;
        }
      }
    }
    return null;
  }

  // Gets the codec payload type from sdp lines.
  function getCodecPayloadType(sdpLines, codec) {
    var index = findLine(sdpLines, 'a=rtpmap', codec);
    return index ? getCodecPayloadTypeFromLine(sdpLines[index]) : null;
  }

  // Gets the codec payload type from an a=rtpmap:X line.
  function getCodecPayloadTypeFromLine(sdpLine) {
    var pattern = new RegExp('a=rtpmap:(\\d+) [a-zA-Z0-9-]+\\/\\d+', 'i');
    var result = sdpLine.match(pattern);
    return (result && result.length === 2) ? result[1] : null;
  }

  // Returns a new m= line with the specified codec as the first one.
  function setDefaultCodec(mLine, payload) {
    var elements = mLine.split(' ');

    // Just copy the first three parameters; codec order starts on fourth.
    var newLine = elements.slice(0, 3);

    // Put target payload first and copy in the rest.
    newLine.push(payload);
    for (var i = 3; i < elements.length; i++) {
      if (elements[i] !== payload) {
        newLine.push(elements[i]);
      }
    }
    return newLine.join(' ');
  }

  // Modify m-line. Put preferred payload type in the front of other types.
  // mediaType is 'audio' or 'video'.
  var setPreferredCodec = function(sdp, mediaType, codecName) {
    if (!mediaType || !codecName) {
      L.Logger.warning('Media type or codec name is not provided.');
      return sdp;
    }

    var sdpLines = sdp.split('\r\n');

    // Search for m line.
    var mLineIndex = findLine(sdpLines, 'm=', mediaType);
    if (mLineIndex === null) {
      return sdp;
    }

    // If the codec is available, set it as the default in m line.
    var payload = getCodecPayloadType(sdpLines, codecName);
    if (payload) {
      sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex],
        payload);
    }

    sdp = sdpLines.join('\r\n');
    return sdp;
  };

  // Add a b=AS:bitrate line to the m=mediaType section.
  function preferBitRate(sdp, mediaType, bitrate) {
    var sdpLines = sdp.split('\r\n');

    // Find m line for the given mediaType.
    var mLineIndex = findLine(sdpLines, 'm=', mediaType);
    if (mLineIndex === null) {
      L.Logger.debug(
        'Failed to add bandwidth line to sdp, as no m-line found');
      return sdp;
    }

    // Find next m-line if any.
    var nextMLineIndex = findLineInRange(sdpLines, mLineIndex + 1, -1, 'm=');
    if (nextMLineIndex === null) {
      nextMLineIndex = sdpLines.length;
    }

    // Find c-line corresponding to the m-line.
    var cLineIndex = findLineInRange(sdpLines, mLineIndex + 1,
      nextMLineIndex, 'c=');
    if (cLineIndex === null) {
      L.Logger.debug(
        'Failed to add bandwidth line to sdp, as no c-line found');
      return sdp;
    }

    // Check if bandwidth line already exists between c-line and next m-line.
    var bLineIndex = findLineInRange(sdpLines, cLineIndex + 1,
      nextMLineIndex, 'b=AS');
    if (bLineIndex) {
      sdpLines.splice(bLineIndex, 1);
    }

    // Create the b (bandwidth) sdp line.
    var bwLine = 'b=AS:' + bitrate;
    // As per RFC 4566, the b line should follow after c-line.
    sdpLines.splice(cLineIndex + 1, 0, bwLine);
    sdp = sdpLines.join('\r\n');
    return sdp;
  }

  /* Above functions are copied from apprtc with modifications */

  // Returns system information.
  // Format: {sdk:{version:**, type:**}, runtime:{version:**, name:**}, os:{version:**, name:**}};
  var sysInfo = function() {
    var info = Object.create({});
    info.sdk = {
      version: sdkVersion,
      type: 'JavaScript'
    };
    // Runtime info.
    var userAgent = navigator.userAgent;
    var firefoxRegex = /Firefox\/([0-9\.]+)/;
    var chromeRegex = /Chrome\/([0-9\.]+)/;
    var edgeRegex = /Edge\/([0-9\.]+)/;
    var result = chromeRegex.exec(userAgent);
    if (result) {
      info.runtime = {
        name: 'Chrome',
        version: result[1]
      };
    } else if (result = firefoxRegex.exec(userAgent)) {
      info.runtime = {
        name: 'FireFox',
        version: result[1]
      };
    } else if (result = edgeRegex.exec(userAgent)) {
      info.runtime = {
        name: 'Edge',
        version: result[1]
      };
    } else {
      info.runtime = {
        name: 'Unknown',
        version: 'Unknown'
      };
    }
    // OS info.
    var windowsRegex = /Windows NT ([0-9\.]+)/;
    var macRegex = /Intel Mac OS X ([0-9_\.]+)/;
    var iPhoneRegex = /iPhone OS ([0-9_\.]+)/;
    var linuxRegex = /X11; Linux/;
    var androidRegex = /Android( ([0-9\.]+))?/;
    var chromiumOsRegex = /CrOS/;
    if (result = windowsRegex.exec(userAgent)) {
      info.os = {
        name: 'Windows NT',
        version: result[1]
      };
    } else if (result = macRegex.exec(userAgent)) {
      info.os = {
        name: 'Mac OS X',
        version: result[1].replace(/_/g, '.')
      };
    } else if (result = iPhoneRegex.exec(userAgent)) {
      info.os = {
        name: 'iPhone OS',
        version: result[1].replace(/_/g, '.')
      };
    } else if (result = linuxRegex.exec(userAgent)) {
      info.os = {
        name: 'Linux',
        version: 'Unknown'
      };
    } else if (result = androidRegex.exec(userAgent)) {
      info.os = {
        name: 'Android',
        version: result[1] || 'Unknown'
      };
    } else if (result = chromiumOsRegex.exec(userAgent)) {
      info.os = {
        name: 'Chrome OS',
        version: 'Unknown'
      };
    } else {
      info.os = {
        name: 'Unknown',
        version: 'Unknown'
      };
    }
    return info;
  };

  return {
    parseStats: parseStats,
    parseAudioLevel: parseAudioLevel,
    setPreferredCodec: setPreferredCodec,
    setPreferredBitrate: preferBitRate,
    sysInfo: sysInfo
  };
}());

/*
 * Following UI code is for backward compability. Delete it when it is old enough.
 * Detailed reason: we provide global function |attachMediaStream| in the old adapter.js. However, it has been move to adapter.browserShim.attachMediaStream in the latest code, and it will be removed in the future. We should modify adapter.js as less as possible. So we provide |attachMediaStream| in Woogeen.UI namespace.
 */
attachMediaStream = function() {
  L.Logger.warning(
    'Global attachMediaStream is deprecated, pleause include woogeen.sdk.ui.js and use Woogeen.UI.attachMediaStream instead.'
  );
  adapter.browserShim.attachMediaStream.apply(this, arguments);
};