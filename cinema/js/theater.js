if (window.swfobject == undefined) window.swfobject = null;
window.open = function() { return null; }; // prevent popups

var theater = {

	VERSION: '1.4.2-YukiTheater',

	playerContainer: null,
	playerContent: null,
	// closedCaptions: false,
	// language: "en",
	hdPlayback: false,
	player: null,
	volume: 25,
	syncMaxDiff: 10,

	getPlayerContainer: function() {
		if ( this.playerContainer == null ) {
			this.playerContainer = document.getElementById('player-container') ||
				document.createElement('div');
		}
		return this.playerContainer;
	},

	getPlayerContent: function() {
		if ( this.playerContent == null ) {
			this.playerContent = document.getElementById('content') ||
				document.createElement('div');
		}
		return this.playerContent;
	},

	resetPlayer: function() {
		if ( this.player ) {
			this.player.onRemove();
			delete this.player;
		}
		this.getPlayerContainer().innerHTML = "<div id='player'></div>";
	},

	enablePlayer: function() {
		// Show player
		var player = this.getPlayerContainer();
		player.style.display = "block";

		// Hide content
		var content = this.getPlayerContent();
		content.style.display = "none";
	},

	disablePlayer: function() {
		// Hide player
		var player = this.getPlayerContainer();
		player.style.display = "none";

		this.resetPlayer();

		// Show content
		var content = this.getPlayerContent();
		content.style.display = "block";
	},

	getPlayer: function() {
		return this.player;
	},

	loadVideo: function( type, data, startTime ) {

		if ( ( type == null ) || ( data == null ) ) return;
		
		if ( type == "" ) {
			this.disablePlayer();
			return;
		}

		startTime = Math.max( 0, startTime );

		var player = this.getPlayer();

		// player doesn't exist or is different video type
		if ( (player == null) || (player.getType() != type) ) {

			this.resetPlayer();
			this.enablePlayer();

			var playerObject = getPlayerByType( type );
			if ( playerObject != null ) {
				this.player = new playerObject();
			} else {
				this.getPlayerContainer().innerText = "ERROR: Video type not yet implemented.";
				this.getPlayerContainer().style.color = "red";
				return;
			}

		}

		// Video Service Usage Tracking
		ga('send', 'event', 'services', 'load', type);
		
		this.player.setVolume( (this.volume != null) ? this.volume : 25 );
		this.player.setStartTime( startTime || 0 );
		this.player.setVideo( data );
		console.log("Initializing Player: " + type + " at " + startTime + " seconds...");
	},

	setVolume: function( volume ) {
		this.volume = volume;
		if ( this.player != null ) {
			this.player.setVolume( volume );
		}
	},

	seek: function( seconds ) {
		var player = this.getPlayer();
		if ( player ) {
			player.seek( seconds );
		}
	},

	setForceVideoRes: function(bool) {
		if (this.forceVideoRes != bool) {
			this.forceVideoRes = bool;
			console.log("forceVideoRes set to " + bool + "!");
		}
	},

	isForceVideoRes: function() {
		return this.forceVideoRes;
	},

	sync: function( time ) {

		if ( time == null ) return;

		if ( this.player != null ) {

			var current = this.player.getCurrentTime();
			if ( ( current != null ) &&
				( Math.abs(time - current) > this.syncMaxDiff ) ) {
				this.player.setStartTime( time );
				console.log("Attempting to sync player to " + time + " seconds...");
			}

		}

	},

	toggleControls: function( enabled ) {
		if ( this.player != null ) {
			this.player.toggleControls( enabled );
		}
	},

	/*
		Google Chromeless player doesn't support closed captions...
		http://code.google.com/p/gdata-issues/issues/detail?id=444
	*/
	
	enableCC: function() {
		this.closedCaptions = true;
	},

	isCCEnabled: function() {
		return this.closedCaptions;
	}

	/*clickPlayerCenter: function() {
		var evt = document.createEvent("MouseEvents");

		var player = document.getElementById("player");

		var w = player.clientWidth / 2,
			h = player.clientHeight / 2;

		evt.initMouseEvent("click", true, true, window,
			0, 0, 0, w, h, false, false, false, false, 0, null);

		this.getPlayer().dispatchEvent(evt);
	},

	setLanguage: function( language ) {
		this.language = language;
	}
	*/

};


var players = [];

function getPlayerByType( type ) {
	return players[ type ];
}

var DefaultVideo = function() {};
DefaultVideo.prototype = {
	player: null,

	lastVideoId: null,
	videoId: null,

	lastVolume: null,
	volume: 0.123,

	currentTime: 0,

	getCurrentTime: function() {
		return null;
	},

	lastStartTime: 0,
	startTime: 0,

	setVolume: function( volume ) {},
	setStartTime: function( seconds ) {},
	seek: function( seconds ) {},
	onRemove: function() {},
	toggleControls: function() {}
};

function registerPlayer( type, object ) {
	object.prototype = new DefaultVideo();
	object.prototype.type = type;
	object.prototype.getType = function() {
		return this.type;
	};

	players[ type ] = object;
}

/*
	If someone is reading this and trying to figure out how
	I implemented each player API, here's what I did.

	To avoid endlessly searching for API documentations, I
	discovered that by decompiling a swf file, you can simply
	search for "ExternalInterface.addCallback" for finding
	JavaScript binded functions. And by reading the actual 
	source code, things should be much easier.

	This website provides a quick-and-easy way to decompile
	swf code http://www.showmycode.com/

	If you need additional information, you can reach me through
	the following contacts:

	samuelmaddock.com
	samuel.maddock@gmail.com
	http://steamcommunity.com/id/samm5506


	Test Cases

	theater.loadVideo( "youtube", "JVxe5NIABsI", 30 )
	theater.loadVideo( "youtubelive", "0Sdkwsw2Ji0" )
	theater.loadVideo( "vimeo", "55874553", 30 )
	theater.loadVideo( "twitch", "mega64podcast,c4320640", 30*60 )
	theater.loadVideo( "twitch", "cosmowright,c1789194" )
	theater.loadVideo( "twitchstream", "ignproleague" )
	Justin.TV Support removed 8-5-2014
	theater.loadVideo( "blip", "6484826", 60 )
	theater.loadVideo( "html", "<span style='color:red;'>Hello world!</span>", 10 )
	theater.loadVideo( "viooz", "", 0 )
	thetaer.loadVideo( "dailymotion", "x1946tk", 0 )
	theater.loadVideo( "ustreamlive", "1524" )

*/
(function() {

	var YouTubeVideo = function() {

		/*
			Embed Player Object
		*/
		var params = {
			allowScriptAccess: "always",
			bgcolor: "#000000",
			wmode: "opaque"
		};
		
		var attributes = {
			id: "player",
		};
		
		var url = "https://www.youtube.com/get_player?enablejsapi=1&modestbranding=1&autohide=1&controls=1&autoplay=1&iv_load_policy=3";
		if ( theater.isCCEnabled() ) {
			url += "&cc_load_policy=1";
			url += "&yt:cc=on";
		}
		
		swfobject.embedSWF( url, "player", "100%", "100%", "9", null, null, params, attributes );
		
		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastStartTime = null;
			this.lastVideoId = null;
			this.videoId = id;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
		};

		this.seek = function( seconds ) {
			if ( this.player != null ) {
				this.player.seekTo( seconds, true );

				// Video isn't playing
				if ( this.player.getPlayerState() != 1 ) {
					this.player.playVideo();
				}
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.getCurrentTime = function() {
			if ( this.player != null ) {
				return this.player.getCurrentTime();
			}
		};

		this.canChangeTime = function() {
			if ( this.player != null ) {
				//Is loaded and it is not buffering
				return this.player.getVideoBytesTotal() != -1 &&
				this.player.getPlayerState() != 3;
			}
		};

		this.think = function() {

			if ( this.player != null ) {
				
				if ( theater.isForceVideoRes() ) {
					if ( this.lastWindowHeight != window.innerHeight ) {
						if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
							this.ytforceres = "highres";
						}
						if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
							this.ytforceres = "highres";
						}
						if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
							this.ytforceres = "hd1080";
						}
						if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
							this.ytforceres = "hd720";
						}
						if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
							this.ytforceres = "large";
						}
						if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
							this.ytforceres = "medium";
						}
						if ( window.innerHeight <= 240 ) {
							this.ytforceres = "small";
						}
						
						this.player.setPlaybackQuality(this.ytforceres);
						console.log("Forcing Quality Change to " + this.ytforceres);
						
						this.lastWindowHeight = window.innerHeight;
					}
				}
				
				if ( this.videoId != this.lastVideoId ) {
					this.player.loadVideoById( this.videoId, this.startTime, this.ytforceres ? this.ytforceres : "default");
					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				if ( this.player.getPlayerState() != -1 ) {

					if ( this.startTime != this.lastStartTime ) {
						this.seek( this.startTime );
						this.lastStartTime = this.startTime;
					}
					
					if ( this.volume != this.lastVolume ) {
						this.player.setVolume( this.volume );
						this.lastVolume = this.volume;
					}

				}
			}

		};

		this.onReady = function() {
			this.player = document.getElementById('player');

			if ( theater.isForceVideoRes() ) {
				if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
					this.ytforceres = "highres";
				}
				if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
					this.ytforceres = "highres";
				}
				if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
					this.ytforceres = "hd1080";
				}
				if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
					this.ytforceres = "hd720";
				}
				if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
					this.ytforceres = "large";
				}
				if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
					this.ytforceres = "medium";
				}
				if ( window.innerHeight <= 240 ) {
					this.ytforceres = "small";
				}
				
				this.player.setPlaybackQuality(this.ytforceres);
				console.log("Forcing Quality Change to " + this.ytforceres);
			}

			this.interval = setInterval( this.think.bind(this), 100 );
		};

	};
	registerPlayer( "youtube", YouTubeVideo );

	var YouTubeLiveVideo = function() {

		/*
			Embed Player Object
		*/
		var player;

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastStartTime = null;
			this.lastVideoId = null;
			this.videoId = id;
			
			if (player) { return; }

			player = new YT.Player('player', {
				height: '100%',
				width: '100%',
				videoId: id,
				playerVars: {
					autoplay: 1,
					controls: 1,
					autohide: 1,
					iv_load_policy: 3, // hide annotations
					cc_load_policy: theater.closedCaptions ? 1 : 0
				},
				events: {
					onReady: onYouTubePlayerReady,
				}
			});
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
		};

		this.seek = function( seconds ) {
			if ( this.player !== null ) {
				this.player.seekTo( seconds, true );

				// Video isn't playing
				if ( this.player.getPlayerState() != 1 ) {
					this.player.playVideo();
				}
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.getCurrentTime = function() {
			if ( this.player !== null ) {
				return this.player.getCurrentTime();
			}
		};

		this.canChangeTime = function() {
			if ( this.player !== null ) {
				//Is loaded and it is not buffering
				return this.player.getVideoBytesTotal() != -1 &&
				this.player.getPlayerState() != 3;
			}
		};

		this.think = function() {

			if ( this.player !== null ) {
				
				if ( theater.isForceVideoRes() ) {
					if ( this.lastWindowHeight != window.innerHeight ) {
						if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
							this.ytforceres = "highres";
						}
						if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
							this.ytforceres = "highres";
						}
						if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
							this.ytforceres = "hd1080";
						}
						if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
							this.ytforceres = "hd720";
						}
						if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
							this.ytforceres = "large";
						}
						if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
							this.ytforceres = "medium";
						}
						if ( window.innerHeight <= 240 ) {
							this.ytforceres = "small";
						}
						
						this.player.setPlaybackQuality(this.ytforceres);
						console.log("Forcing Quality Change to " + this.ytforceres);
						
						this.lastWindowHeight = window.innerHeight;
					}
				}
				
				if ( this.videoId != this.lastVideoId ) {
					this.player.loadVideoById( this.videoId, this.startTime, this.ytforceres ? this.ytforceres : "default");
					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				if ( this.player.getPlayerState() != -1 ) {

					if ( this.startTime != this.lastStartTime ) {
						this.seek( this.startTime );
						this.lastStartTime = this.startTime;
					}
					
					if ( this.volume != this.lastVolume ) {
						this.player.setVolume( this.volume );
						this.lastVolume = this.volume;
					}

				}
			}

		};

		this.onReady = function() {
			this.player = player;

			if ( theater.isForceVideoRes() ) {
				if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
					this.ytforceres = "highres";
				}
				if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
					this.ytforceres = "highres";
				}
				if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
					this.ytforceres = "hd1080";
				}
				if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
					this.ytforceres = "hd720";
				}
				if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
					this.ytforceres = "large";
				}
				if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
					this.ytforceres = "medium";
				}
				if ( window.innerHeight <= 240 ) {
					this.ytforceres = "small";
				}
				
				this.player.setPlaybackQuality(this.ytforceres);
				console.log("Forcing Quality Change to " + this.ytforceres);
			}

			this.interval = setInterval( this.think.bind(this), 100 );
		};

	};
	registerPlayer( "youtubelive", YouTubeLiveVideo );

	var VimeoVideo = function() {

		var self = this;

		this.froogaloop = null;

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.videoId = id;

			var elem = document.getElementById("player1");
			if (elem) {
				$f(elem).removeEvent('ready');
				this.froogaloop = null;
				elem.parentNode.removeChild(elem);
			}

			var url = "https://player.vimeo.com/video/" + id + "?api=1&player_id=player1";

			var frame = document.createElement('iframe');
			frame.setAttribute('id', 'player1');
			frame.setAttribute('src', url);
			frame.setAttribute('width', '100%');
			frame.setAttribute('height', '100%');
			frame.setAttribute('frameborder', '0');

			document.getElementById('player').appendChild(frame);

			$f(frame).addEvent('ready', this.onReady);
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume / 100;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;

			// Set minimum of 1 seconds due to Awesomium issues causing
			// the Vimeo player not to load.
			this.startTime = Math.max( 1, seconds );
		};

		this.seek = function( seconds ) {
			if ( this.froogaloop != null && seconds > 1 ) {
				// We pause it before seeking because Vimeo Player + Awesomium is special
				this.froogaloop.api('pause');
				this.froogaloop.api('seekTo', seconds);
				this.froogaloop.api('play');
			}
		};

		this.onRemove = function() {
			this.froogaloop = null;
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.getCurrentTime = function() {
			if ( this.froogaloop != null ) {
				return self.currentTime || 1;
			}
		};

		this.think = function() {

			if ( this.froogaloop != null ) {

				if ( this.volume != this.lastVolume ) {
					this.froogaloop.api('setVolume', this.volume);
					this.lastVolume = this.volume;
				}

				if ( this.startTime != this.lastStartTime ) {
					this.seek( this.startTime );
					this.lastStartTime = this.startTime;
				}

				this.froogaloop.api('getVolume', function(v) {
					self.volume = parseFloat(v);
				});

				this.froogaloop.api('getCurrentTime', function(v) {
					self.currentTime = parseFloat(v);
				});

			}

		};

		this.onReady = function( player_id ) {
			self.lastStartTime = null;
			self.froogaloop = $f(player_id);
			self.froogaloop.api('play');
			setTimeout(function() { // Work around the player not actually being ready to seek until it's started playing :/
				// Also, if you manage to call this in the middle of it loading, it creates a race-condition where currentTime won't actually be where the video is! :D
				self.interval = setInterval( function() { self.think(self); }, 100 );
			}, 2500);
		};

	};
	registerPlayer( "vimeo", VimeoVideo );

	var TwitchVideo = function() {

		var self = this;

		this.videoInfo = {};

		/*
			Embed Player Object
		*/
		this.embed = function() {

			if ( !this.videoInfo.channel ) return;
			if ( !this.videoInfo.archive_id ) return;

			var flashvars = {
				hostname: "www.twitch.tv",
				channel: this.videoInfo.channel,
				auto_play: true,
				start_volume: (this.videoInfo.volume || theater.volume),
				initial_time: (this.videoInfo.initial_time || 0)
			};

			var id = this.videoInfo.archive_id.slice(1),
				videoType = this.videoInfo.archive_id.substr(0,1);
				
			flashvars.videoId = videoType + id;
			
			if (videoType == "c") {
				flashvars.chapter_id = id;
			} else {
				flashvars.archive_id = id;
			}

			var swfurl = "https://www.twitch.tv/swflibs/TwitchPlayer.swf";

			var params = {
				"allowFullScreen": "true",
				"allowNetworking": "all",
				"allowScriptAccess": "always",
				"movie": swfurl,
				"wmode": "opaque",
				"bgcolor": "#000000"
			};

			swfobject.embedSWF(
				swfurl,
				"player",
				"100%",
				"104%",
				"9.0.0",
				false,
				flashvars,
				params
			);

		};

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;

			var info = id.split(',');

			this.videoInfo.channel = info[0];
			this.videoInfo.archive_id = info[1];

			// Wait for player to be ready
			if ( this.player == null ) {
				this.lastVideoId = this.videoId;
				this.embed();

				var i = 0;
				var interval = setInterval( function() {
					var el = document.getElementById("player");
					if(el.mute){
						clearInterval(interval);
						self.onReady();
					}

					i++;
					if (i > 100) {
						console.log("Error waiting for player to load");
						clearInterval(interval);
					}
				}, 33);
			}
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
			this.videoInfo.volume = volume;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
			this.videoInfo.initial_time = seconds;
		};

		this.seek = function( seconds ) {
			this.setStartTime( seconds );
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.think = function() {

			if ( this.player ) {
				
				if ( this.videoId != this.lastVideoId ) {
					this.embed();
					this.lastVideoId = this.videoId;
				}

				if ( this.startTime != this.lastStartTime ) {
					this.embed();
					this.lastStartTime = this.startTime;
				}

				if ( this.volume != this.lastVolume ) {
					// this.embed(); // volume doesn't change...
					this.lastVolume = this.volume;
				}

			}

		};

		this.onReady = function() {
			this.player = document.getElementById('player');
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};

		this.toggleControls = function( enabled ) {
			this.player.height = enabled ? "100%" : "104%";
		};

	};
	registerPlayer( "twitch", TwitchVideo );

	var TwitchStreamVideo = function() {

		var self = this;

		/*
			Embed Player Object
		*/
		this.embed = function() {

			var flashvars = {
				hostname: "www.twitch.tv",
				hide_chat: true,
				channel: this.videoId,
				embed: 0,
				auto_play: true,
				start_volume: (this.volume || theater.volume || 25)
			};

			var swfurl = "https://www.twitch.tv/swflibs/TwitchPlayer.swf";

			var params = {
				"allowFullScreen": "true",
				"allowNetworking": "all",
				"allowScriptAccess": "always",
				"movie": swfurl,
				"wmode": "opaque",
				"bgcolor": "#000000"
			};

			swfobject.embedSWF(
				swfurl,
				"player",
				"100%",
				"104%",
				"9.0.0",
				false,
				flashvars,
				params
			);

		};

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;

			// Wait for player to be ready
			if ( this.player == null ) {
				this.lastVideoId = this.videoId;
				this.embed();

				var i = 0;
				var interval = setInterval( function() {
					var el = document.getElementById("player");
					if(el.mute){
						clearInterval(interval);
						self.onReady();
					}

					i++;
					if (i > 100) {
						console.log("Error waiting for player to load");
						clearInterval(interval);
					}
				}, 33);
			}
		};
		
		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
		};
		
		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.think = function() {

			if ( this.player ) {
				
				if ( this.videoId != this.lastVideoId ) {
					this.embed();
					this.lastVideoId = this.videoId;
				}
				
				 if ( this.volume != this.lastVolume ) {
					// this.embed(); // volume doesn't change...
					this.lastVolume = this.volume;
				}
				
			}

		};

		this.onReady = function() {
			this.player = document.getElementById('player');
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};

		this.toggleControls = function( enabled ) {
			this.player.height = enabled ? "100%" : "104%";
		};

	};
	registerPlayer( "twitchstream", TwitchStreamVideo );

	var UrlVideo = function() {

		var self = this;

		/*
			Embed Player Object
		*/
		this.embed = function() {

			var elem = document.getElementById("player1");
			if (elem) {
				elem.parentNode.removeChild(elem);
			}

			var frame = document.createElement('iframe');
			frame.setAttribute('id', 'player1');
			frame.setAttribute('src', this.videoId);
			frame.setAttribute('width', '100%');
			frame.setAttribute('height', '100%');
			frame.setAttribute('frameborder', '0');

			document.getElementById('player').appendChild(frame);

		};

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;

			// Wait for player to be ready
			if ( this.player == null ) {
				this.lastVideoId = this.videoId;
				this.embed();

				var i = 0;
				var interval = setInterval( function() {
					var el = document.getElementById("player");
					if(el){
						clearInterval(interval);
						self.onReady();
					}

					i++;
					if (i > 100) {
						console.log("Error waiting for player to load");
						clearInterval(interval);
					}
				}, 33);
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.think = function() {

			if ( this.player ) {
				
				if ( this.videoId != this.lastVideoId ) {
					this.embed();
					this.lastVideoId = this.videoId;
				}

			}

		};

		this.onReady = function() {
			this.player = document.getElementById('player');
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};

	};
	registerPlayer( "url", UrlVideo );

	// Thanks to WinterPhoenix96 for helping with Livestream support
	var LivestreamVideo = function() {

		var flashvars = {};

		var swfurl = "https://cdn.livestream.com/chromelessPlayer/wrappers/JSPlayer.swf";
		// var swfurl = "http://cdn.livestream.com/chromelessPlayer/v20/playerapi.swf";

		var params = {
			// "allowFullScreen": "true",
			"allowNetworking": "all",
			"allowScriptAccess": "always",
			"movie": swfurl,
			"wmode": "opaque",
			"bgcolor": "#000000"
		};

		swfobject.embedSWF(
			swfurl,
			"player",
			"100%",
			"100%",
			"9.0.0",
			"expressInstall.swf",
			flashvars,
			params
		);

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume / 100;
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.think = function() {

			if ( this.player != null ) {

				if ( this.videoId != this.lastVideoId ) {
					this.player.load( this.videoId );
					this.player.startPlayback();
					this.lastVideoId = this.videoId;
				}
				
				if ( this.volume != this.lastVolume ) {
					this.player.setVolume( this.volume );
					this.lastVolume = this.volume;
				}
				
			}

		};
		
		this.onReady = function() {
			this.player = document.getElementById('player');

			var self = this;
			this.interval = setInterval( function() { self.think(self); }, 100 );
			this.player.setVolume( this.volume );
		};
		
	};
	registerPlayer( "livestream", LivestreamVideo );


	var HtmlVideo = function() {

		/*
			Embed Player Object
		*/
		this.embed = function() {

			var elem = document.getElementById("player1");
			if (elem) {
				elem.parentNode.removeChild(elem);
			}

			var content = document.createElement('div');
			content.setAttribute('id', 'player1');
			content.style.width = "100%";
			content.style.height = "100%";
			content.innerHTML = this.videoId;

			document.getElementById('player').appendChild(content);

		};

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;
			this.embed();
		};

	};
	registerPlayer( "html", HtmlVideo );

	var UstreamLiveVideo = function() {
		
		var pre_player = document.createElement('iframe');
		pre_player.src = "https://www.ustream.tv/embed/1?controls=false"; // bogus channel
		pre_player.id = "player";
		pre_player.width = "100%";
		pre_player.height = "100%";
		var player_container = document.getElementById('player').parentNode;
		player_container.removeChild(document.getElementById('player'));
		player_container.appendChild(pre_player);
		
		var viewer = UstreamEmbed('player');
		
		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.think = function() {

			if ( this.player != null ) {
				
				if ( this.videoId != this.lastVideoId ) {
					this.player.callMethod( 'load', 'channel', this.videoId );
					
					var self = this;
					setTimeout(function(){self.player.callMethod('play');}, 3000);
					
					setTimeout(function(){
						if ( theater.isForceVideoRes() ) {
							if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
								this.player.callMethod( 'quality', 16 );
							}
							if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
								this.player.callMethod( 'quality', 16 );
							}
							if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
								this.player.callMethod( 'quality', 16 );
							}
							if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
								this.player.callMethod( 'quality', 16 );
							}
							if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
								this.player.callMethod( 'quality', 2 );
							}
							if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
								this.player.callMethod( 'quality', 1 );
							}
							if ( window.innerHeight <= 240 ) {
								this.player.callMethod( 'quality', 0 );
							}
						};
					}, 5000);
					
					this.lastVideoId = this.videoId;
				}
				
				if ( this.volume != this.lastVolume ) {
					this.player.callMethod( 'volume', (this.volume < 100) ? this.volume : 99); // 100% Volume on this Player mutes it
					this.lastVolume = this.volume;
				}
				
			}

		};
		
		this.onReady = function() {
			this.player = viewer;
			
			var self = this;
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};
		
		var self = this;
		setTimeout(function(){self.onReady()}, 2000);
	};
	registerPlayer( "ustreamlive", UstreamLiveVideo );

	var YukiTheaterRTMP = function() {
		videojs.options.flash.swf = "video-js-5.9.2/video-js.swf"

		var pre_player = document.createElement('video');
		pre_player.className = "video-js vjs-default-skin";
		pre_player.id = "player";
		pre_player.preload = "auto";
		pre_player.autoplay = "true";
		var player_container = document.getElementById('player').parentNode;
		player_container.removeChild(document.getElementById('player'));
		player_container.appendChild(pre_player);

		var viewer = videojs('player');
		viewer.poster("http://www.yukitheater.org/theater/rtmp-thumbnail.png");

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume / 100;
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.think = function() {

			if ( this.player != null ) {
				if ( this.videoId != this.lastVideoId ) {
					this.player.src({ type: "rtmp/mp4", src: "rtmp://rtmp.yukitheater.org/live/" + this.videoId + "/"});
					this.lastVideoId = this.videoId;
					this.lastSrcChange = Math.round(Date.now()/1000) + 5; // Wait 5 seconds and then try again if it isn't working
				}

				if (this.lastSrcChange != "undefined") {
					var curTime = Math.round(Date.now()/1000)
					if (curTime >= this.lastSrcChange && this.player.readyState() === 0) {
						console.log("Attempt to load RTMP Stream Failed! Retrying...");
						this.player.src({ type: "rtmp/mp4", src: "rtmp://rtmp.yukitheater.org/live/" + this.videoId + "/"});
						this.lastSrcChange = Math.round(Date.now()/1000) + 5;
					}
				}

				if ( this.volume != this.lastVolume ) {
					this.player.volume( this.volume );
					this.lastVolume = this.volume;
				}
			}
		};

		this.onReady = function() {
			this.player = viewer;

			var self = this;
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};
		
		this.toggleControls = function( enabled ) {
			this.player.controls(enabled);
		};
		
		var self = this;
		viewer.ready(function(){self.onReady();});
		
	};
	registerPlayer( "yukirtmp", YukiTheaterRTMP );

	var Kiss = function() {
		// JW7 Key
		jwplayer.key="GBbtI9R8M4R2gQOTSs7m7AdoMdxpK3DD4IcgmQ==";

		/*
			Embed Player Object
		*/
		var viewer = jwplayer("player");
		viewer.setup({
			height: "100%",
			width: "100%",
			controls: false,
			autostart: true,
			primary: 'flash',
			displaytitle: true,
			file: "example.mp4"
		});

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastStartTime = null;
			this.lastVideoId = null;
			this.videoId = id;
			this.sentKissDuration = false;
			this.initSeek = false;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
		};

		this.seek = function( seconds ) {
			if ( this.player != null ) {
				this.player.seek( seconds );

				if ( this.player.getState() == "paused" || this.player.getState() == "idle" ) {
					this.player.play(true);
				}
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.getCurrentTime = function() {
			if ( this.player != null ) {
				return this.player.getPosition();
			}
		};

		this.canChangeTime = function() {
			if ( this.player != null ) {
				//Is loaded and it is not buffering
				return this.player.getState() != "buffering";
			}
		};

		this.think = function() {
			if ( this.player != null ) {
				if ( theater.isForceVideoRes() && this.player.getState() == "playing" ) {
					if ( this.lastWindowHeight != window.innerHeight ) {
						var qualityLevels = this.player.getPlaylist()[0].sources;
						var resMatching = [];
						var defaultQuality = null;

						for (var i=0; i < qualityLevels.length; i++) {
							resMatching[qualityLevels[i]["label"]] = i;

							if (qualityLevels[i]["default"]) {
								defaultQuality = i;
							}
						}

						if (defaultQuality == null) {
							defaultQuality = ("720p" in resMatching) ? resMatching["720p"] : 1; // We're just gonna guess! :D
						}

						if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
							this.forceRes = ("1080p" in resMatching) ? resMatching["1080p"] : defaultQuality;
						}
						if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
							this.forceRes = ("1080p" in resMatching) ? resMatching["1080p"] : defaultQuality;
						}
						if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
							this.forceRes = ("1080p" in resMatching) ? resMatching["1080p"] : defaultQuality;
						}
						if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
							this.forceRes = ("720p" in resMatching) ? resMatching["720p"] : defaultQuality;
						}
						if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
							this.forceRes = ("480p" in resMatching) ? resMatching["480p"] : defaultQuality;
						}
						if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
							this.forceRes = ("360p" in resMatching) ? resMatching["360p"] : defaultQuality;
						}
						if ( window.innerHeight <= 240 ) {
							this.forceRes = ("240p" in resMatching) ? resMatching["240p"] : defaultQuality;
						}

						this.player.setCurrentQuality(this.forceRes);
						console.log("Forcing Quality Change to " + this.forceRes);

						this.lastWindowHeight = window.innerHeight;
					}
				}

				if ( this.videoId != this.lastVideoId ) {
					var self = this;
					setTimeout(function(){
						if (!self.player.getPlaylist()[0] || self.player.getPlaylist()[0].file == "example.mp4") { // Let's make sure it moved on with loading...
							self.onRemove();
							theater.getPlayerContainer().innerHTML = "<div id='player'><div style='color: red;'>ERROR: Kiss Video Sources Load Failure</div></div>";
							return;
						}
					}, 3000);

					if ( this.videoId.lastIndexOf("ol_", 0) === 0 ) {
						// Base64 -> UTF-8 String -> Load JS -> Grab vs variable -> XHR to get actual video -> Load Video *sigh*
						eval(base64.decode(this.videoId.replace("ol_", "")));
						if (typeof vs !== "undefined" && typeof vs !== "null") {
							this.player.load([{ file: vs }]); // Doesn't work because JWPlayer doesn't resolve 302 Redirects
							vs = null;
						}
					} else if (this.videoId.lastIndexOf("jw_aes_", 0) === 0) {
						// Encrypted thxa variable (AES+PBKDF2) -> String -> Array (I don't even know if encryption is used with JWPlayer stuff, but hey)
						this.player.load([{ sources: eval($kissenc_aes.decrypt(this.videoId.replace("jw_aes_", ""))) }]);
					} else if (this.videoId.lastIndexOf("jw_sha256_", 0) === 0) {
						// Encrypted thxa variable (SHA256+AES+Base64) -> String -> Array (I don't even know if encryption is used with JWPlayer stuff, but hey)
						this.player.load([{ sources: eval($kissenc_sha256.decrypt(this.videoId.replace("jw_sha256_", ""))) }]);
					} else {
						this.player.load([{ sources: eval(atob(this.videoId.replace("jw_", ""))) }]); // Base64 -> String -> Array
					}
					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				if ( !this.sentKissDuration && this.player.getState() == "playing" && this.player.getDuration() > 0 ) { // Wait until it's ready
					console.log("RUNLUA: theater.SendKissDuration(" + this.player.getDuration() + ")");
					this.sentKissDuration = true;
				}

				if ( this.player.getState() != "idle" ) {

					if ( this.startTime != this.lastStartTime ) {
						this.seek( this.startTime );
						this.lastStartTime = this.startTime;
					}

					if ( this.volume != this.player.getVolume() ) {
						this.player.setVolume( this.volume );
						this.volume = this.player.getVolume();
					}
				}
			}
		};

		this.onReady = function() {
			this.player = viewer;

			var self = this;
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};

		this.toggleControls = function( enabled ) {
			this.player.setControls(enabled);
		};

		var self = this;
		viewer.on('ready', function(){self.onReady();});
		//viewer.on('setupError', function(){document.getElementById('player').innerHTML = "Uh oh";});
	};
	registerPlayer( "kissanime", Kiss );
	registerPlayer( "kissasian", Kiss );
	registerPlayer( "kisscartoon", Kiss );

	var KissYT = function() {
		/*
			Embed Player Object
		*/
		var params = {
			allowScriptAccess: "always",
			bgcolor: "#000000",
			wmode: "opaque"
		};

		var attributes = {
			id: "player",
		};

		var url = "https://www.youtube.com/get_player?enablejsapi=1&modestbranding=1";

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			// We have to reinitialize the Flash Object everytime we change the video
			this.lastStartTime = null;
			this.lastVideoId = null;
			this.videoId = id;

			// Decrypt or Base64 Decode for the flashvars
			if (id.lastIndexOf("yt_aes_", 0) === 0) {
				id = $kissenc_aes.decrypt(id.replace("yt_aes_", ""));
			} else if (id.lastIndexOf("yt_sha256_", 0) === 0) {
				id = $kissenc_sha256.decrypt(id.replace("yt_sha256_", ""));
			} else {
				id = atob(id.replace("yt_", ""));
			};

			var flashvars = {};

			var k;
			var v;
			for (k in id.split("&")) {
				for (v in id.split("&")[k].split("=")) {
					if ((typeof(id.split("&")[k].split("=")[v - 1]) != "undefined") && (typeof(id.split("&")[k].split("=")[v]) != "undefined")) {
						flashvars[id.split("&")[k].split("=")[v - 1].replace("amp;", "")] = id.split("&")[k].split("=")[v];
					};
				};
			};

			swfobject.embedSWF( url, "player", "100%", "100%", "9", null, flashvars, params, attributes );

			this.sentKissDuration = false;
			this.initSeek = false;
		}

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
		};

		this.seek = function( seconds ) {
			if ( this.player != null ) {
				this.player.seekTo( seconds, true );

				// Video isn't playing
				if ( this.player.getPlayerState() != 1 ) {
					this.player.playVideo();
				}
			}
		};

				this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.getCurrentTime = function() {
			if ( this.player != null ) {
				return this.player.getCurrentTime();
			}
		};

		this.canChangeTime = function() {
			if ( this.player != null ) {
				//Is loaded and it is not buffering
				return this.player.getVideoBytesTotal() != -1 && this.player.getPlayerState() != 3;
			}
		};

		this.think = function() {
			if ( this.player != null ) {
				if ( theater.isForceVideoRes() ) {
					if ( this.lastWindowHeight != window.innerHeight ) {
						if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
							this.ytforceres = "highres";
						}
						if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
							this.ytforceres = "highres";
						}
						if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
							this.ytforceres = "hd1080";
						}
						if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
							this.ytforceres = "hd720";
						}
						if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
							this.ytforceres = "large";
						}
						if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
							this.ytforceres = "medium";
						}
						if ( window.innerHeight <= 240 ) {
							this.ytforceres = "small";
						}

						this.player.setPlaybackQuality(this.ytforceres);
						console.log("Forcing Quality Change to " + this.ytforceres);

						this.lastWindowHeight = window.innerHeight;
					}
				}

				if ( this.videoId != this.lastVideoId ) {
					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;

					var self = this;
					setTimeout(function(){
						if (self.player.getPlayerState() == -1) { // Let's make sure it actually loaded...
							theater.getPlayerContainer().innerHTML = "<div id='player'><div style='color: red;'>ERROR: Kiss Video Sources Load Failure</div></div>";
							return;
						}
					}, 5000);
				}

				if ( !this.sentKissDuration && (typeof(this.player.getDuration) === "function") && this.player.getDuration() > 0 ) { // Wait until it's ready
					console.log("RUNLUA: theater.SendKissDuration(" + this.player.getDuration() + ")");
					this.sentKissDuration = true;
				}

				if ( (typeof(this.player.getPlayerState) === "function") && this.player.getPlayerState() != -1 ) {
					// Since startSeconds isn't supported with the FMT Mode we're using...
					if ( !this.initSeek ) {
						this.seek( this.startTime + 3 ); // Assume 3 seconds of buffering
						this.initSeek = true
					}

					if ( this.startTime != this.lastStartTime ) {
						this.seek( this.startTime );
						this.lastStartTime = this.startTime;
					}

					if ( this.volume != this.player.getVolume() ) {
						this.player.setVolume( this.volume );
						this.volume = this.player.getVolume();
					}
				}
			}
		};

		this.onReady = function() {
			this.player = document.getElementById('player');

			if ( theater.isForceVideoRes() ) {
				if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
					this.ytforceres = "highres";
				}
				if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
					this.ytforceres = "highres";
				}
				if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
					this.ytforceres = "hd1080";
				}
				if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
					this.ytforceres = "hd720";
				}
				if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
					this.ytforceres = "large";
				}
				if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
					this.ytforceres = "medium";
				}
				if ( window.innerHeight <= 240 ) {
					this.ytforceres = "small";
				}

				this.player.setPlaybackQuality(this.ytforceres);
				console.log("Forcing Quality Change to " + this.ytforceres);

				this.lastWindowHeight = window.innerHeight;
			};

			var self = this;
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};
	}
	registerPlayer( "kissyoutube", KissYT );

})();

/*
	API-specific global functions
*/

function onYouTubePlayerReady( playerId ) {
	var player = theater.getPlayer(),
		type = player && player.getType();
	if ( player && ((type == "youtube") || (type == "youtubelive") || (type == "kissyoutube")) ) {
		player.onReady();
	}
}

function livestreamPlayerCallback( event, data ) {
	if (event == "ready") {
		var player = theater.getPlayer();
		if ( player && (player.getType() == "livestream") ) {
			player.onReady();
		}
	}
}

function onDailymotionPlayerReady( playerId ) {
	var player = theater.getPlayer();
	if ( player && (player.getType() == "dailymotion") ) {
		player.onReady();
	}
}

if (window.onTheaterReady) {
	onTheaterReady();
}

console.log("Loaded theater.js v" + theater.VERSION);
