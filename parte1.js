function MONOMER() {
	this.pathname = location.pathname;
	this._id = 0;
	this._instance = '';
	this._secretKey = '7c606d287b6d6b7a6d7c287b7c7a61666f';
	this.cipher = cipher(this._secretKey);
	this.decipher = decipher(this._secretKey);
}

MONOMER.prototype.dependencies = function(inputs, promise) {
	/* fetch inject */
  	if (!arguments.length) return Promise.reject(new ReferenceError("Failed to execute 'fetchInject': 1 argument required but only 0 present."))
  	if (arguments[0] && arguments[0].constructor !== Array) return Promise.reject(new TypeError("Failed to execute 'fetchInject': argument 1 must be of type 'Array'."))
  	if (arguments[1] && arguments[1].constructor !== Promise) return Promise.reject(new TypeError("Failed to execute 'fetchInject': argument 2 must be of type 'Promise'."))

  	const resources = [];
  	const deferreds = promise ? [].concat(promise) : [];
  	const thenables = [];

  	inputs.forEach(input => deferreds.push(
	    window.fetch(input).then(res => {
	      	return [res.clone().text(), res.blob()]
	    }).then(promises => {
	      	return Promise.all(promises).then(resolved => {
	        	resources.push({ text: resolved[0], blob: resolved[1] })
	      	})
	    })
  	))

  	return Promise.all(deferreds).then(() => {
	    resources.forEach(resource => {
	      thenables.push({
	        then: resolve => {
	          resource.blob.type.includes('text/css')
	            ? this.injectHead(window, document, 'style', resource, resolve)
	            : this.injectHead(window, document, 'script', resource, resolve)
	        }
	      })
	    })
	    return Promise.all(thenables);
  	});
};

MONOMER.prototype.injectHead = function(i,n,j,e,c,t,s) {
	t = n.createElement(j),
	s = n.getElementsByTagName(j)[0];

	t.appendChild(n.createTextNode(e.text));
	t.onload = c(e);
	s ? s.parentNode.insertBefore(t,s) : n.head.appendChild(t);
};

MONOMER.prototype.getElement = function(selector) {
	if(!selector) {
		return this;
	}
	if (typeof selector === 'string') {
		if(selector[0] === '#') {
			var elem = document.getElementById(selector);
			if(elem) return elem;
		}
	}
};

MONOMER.prototype.stringToURL = function(string) {
	return new URL(string, location.origin);
};

MONOMER.prototype.user = function() {

	var _ud = _userdata || {};

	// get user id
	var id = () => {
		let cookie_name = 'fa_' + location.hostname.replace(/\./g, '_') + '_data';
		return _ud['user_id'] || parseInt((this.getCookie(cookie_name) || "0").replace(/.*s:6:"userid";(i:([0-9]+)|s:[0-9]+:"([0-9]+)");.*/, '$2$3'));
	};
	// get user avatar
	var avatar = () => {
		return _ud['avatar'] ; // or $.get('user_id' img[alt="username"]) ? if not found...
	};
	// get user nb of posts
	var posts = () => {
		return _ud['user_posts'];
	};
	// get user reputation
	var reputation = () => {
		return _ud['point_reputation'];
	};
	// get bool of logged status
	var logged = () => {
		return (_ud["session_logged_in"] || document.querySelector('#logout')) ? true : false;
	};

	var level = () => {
		return _ud['user_level'];
	};

	var rank = () => {
		return window["_lang"] ? _lang["rank_title"] : "";
	};

	if (!arguments.length) {
		// if no argument passed, become utilities et return different values
		return {
			logged, id,
			reputation, avatar,
			posts, level, rank
		}
	} else {
		this._instance = 'u';
		return new Error("La fonction .user() n'est pas encore développée.");
	}
};

/* .forum([id]) return new FA_FORUM(id) */
MONOMER.prototype.forum = function() {
	let pathname = this.pathname;

	var page_type = () => {
		if (pathname == '/') return "index";
	    if (/^\/t[1-9][0-9]*(p[1-9][0-9]*)?-/.test(pathname)) return "topic";
	    if (/^\/f[1-9][0-9]*(p[1-9][0-9]*)?-/.test(pathname)) return "forum";
	    if (/^\/c[1-9][0-9]*-/.test(pathname)) return "category";
	    return "";
	};

	var page_mode = () => {
  		var qs = pathname + location.search;
	    var m = qs.match(/\/modcp\?mode=([^&]+)/);
	    return m || "";
  	};

  	if (!arguments.length) {
  		// if no argument passed, become utilities et return different values
	  	return {
	  		page_type,
	  		page_mode
	  	}
  	} else {
  		let id = arguments[0];
  		if (this.is(id, 'id')) {
  			return new FA_FORUM(id, this);
  		}
		return new Error('Identifiant du forum invalide.')
	}
};

/* .topic([id]) return new FA_TOPIC(id) */
MONOMER.prototype.topic = function() {
	if (!arguments.length) {
		return {

		}
	} else {
		let id = arguments[0];
  		if (this.is(id, 'id')) {
  			return new FA_TOPIC(id, this);
  		}
	}
};

/* .login(username, password, options) return Promise */
MONOMER.prototype.login = function(username, password, options) {
	if (!arguments.length) return;
	return new FA_LOGIN(arguments, this);
};

MONOMER.prototype.logout = function() {
	if(this.user().logged) {
		return new FA_LOGOUT(this);
	}
};

MONOMER.prototype.modal = function(options = {}) {
	return new MONOMER_MODAL(options);
};


/* utilites */
MONOMER.prototype.isValidID = function(arg) {
	return Number.isInteger(arg) && Math.sign(arg) === 1;
};

MONOMER.prototype.isValidURL = function(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(str);
};

MONOMER.prototype.getCookie = function(cname) {
	var name = cname + "=";
  	var decodedCookie = decodeURIComponent(document.cookie);
  	var ca = decodedCookie.split(';');
  	for(var i = 0; i <ca.length; i++) {
	    var c = ca[i];
	    while (c.charAt(0) == ' ') {
	      	c = c.substring(1);
	    }
	    if (c.indexOf(name) == 0) {
	      	return c.substring(name.length, c.length);
	    }
  	}
  	return "";
};

MONOMER.prototype.isPlainObject = function(obj) {
	return Object.prototype.toString.call(obj) === '[object Object]';
};

MONOMER.prototype.isFunction = function(func) {
	return func && {}.toString.call(func) === '[object Function]';
};

MONOMER.prototype.isVisible = function(element) {
    return elem.offsetWidth <= 0 && elem.offsetHeight <= 0;
};

MONOMER.prototype.reload = function() {
	location.reload();
};

MONOMER.prototype.getFormData = function(form) {
	return Object.fromEntries(new FormData(form).entries());
};

MONOMER.prototype.is = function(obj, type) {
	if(!type && typeof type !== "string" || type instanceof String) return;
	switch(type) {
		case "function":
			return obj && {}.toString.call(obj) === '[object Function]';
		break;
		case "object":
			return Object.prototype.toString.call(obj) === '[object Object]';
		break;
		case "id": 
			return Number.isInteger(obj) && Math.sign(obj) === 1;
		break;
		case "visible":
			// obj == dom.element
			return obj.offsetWidth <= 0 && obj.offsetHeight <= 0;
		break;
		case "element":
		  	try {
			    return obj instanceof HTMLElement;
		  	}
		  	catch(e){
			    return (typeof obj==="object") &&
			      (obj.nodeType===1) && (typeof obj.style === "object") &&
			      (typeof obj.ownerDocument ==="object");
			      ;
		  	}		
		break
		default:
			return null;
	}
};

const cipher = salt => {
    const textToChars = text => text.split('').map(c => c.charCodeAt(0));
    const byteHex = n => ("0" + Number(n).toString(16)).substr(-2);
    const applySaltToChar = code => textToChars(salt).reduce((a,b) => a ^ b, code);

    return text => text.split('')
        .map(textToChars)
        .map(applySaltToChar)
        .map(byteHex)
        .join('');
}

const decipher = salt => {
    const textToChars = text => text.split('').map(c => c.charCodeAt(0));
    const applySaltToChar = code => textToChars(salt).reduce((a,b) => a ^ b, code);
    return encoded => encoded.match(/.{1,2}/g)
        .map(hex => parseInt(hex, 16))
        .map(applySaltToChar)
        .map(charCode => String.fromCharCode(charCode))
        .join('');
}


function FA_OBJECT(id, monomer) {
	this._instance_id = id;
	this._m = monomer;
	if(this._m.user().logged()) {
		this._tid = (document.getElementById('logout').href || "").replace(/^.*&tid=([a-z0-9]*)?.*$/, "$1");
	}
}

FA_OBJECT.prototype.requiredArguments = function(args, required) {
	let result = {};
	if (args.length == 0) {
		return false;
	}

	for (var i = 0; i < required.length && i < args.length; i++) {
  		if (this._m.is(args[i]), 'object') break;
      	result[required[i]] = args[i];
    }
    if (args.length > i) {
    	if (this._m.is(args[i]), 'object') {
    		// if more argument is object, will extend;
    		// allows a way to add more field of the original form
    		result = {...result, ...args[i]};
    	}
    	/* should allow a callback function here ? or use of promise */
    }

	return result;
};

FA_OBJECT.prototype.toFormData = function(obj) {
	var form_data = new FormData();

	for ( var key in obj ) {
    	form_data.append(key, obj[key]);
	}
	return form_data;
};

FA_OBJECT.prototype.encodeFormData = function(data) {
	return [...data.entries()].map(x => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`).join('&');
};

FA_OBJECT.prototype.bodyData = function(obj) {
	// compatible data for FA with fetch
	return this.encodeFormData(this.toFormData(obj));
};

FA_OBJECT.prototype.fetchOptions = function(options, body) {
	/* setup default headers and parse of body for FA */
	const update = { ...options };
	update.headers = {
		...update.headers,
		'Content-Type': 'application/x-www-form-urlencoded'
	}
	update.body = this.bodyData(body);
	return update;
};

FA_OBJECT.prototype.fetcher = function(url, options, body) {
	/* new fetch facade with defaults */
	if(window.fetch) {
		return fetch(url, this.fetchOptions(options, body));
	} else {
		// to do, fallback with straight ajax? with axios?
		return new Error("Fetch API not found.");
	}
};

FA_OBJECT.prototype.fetcherFeedback = function(res, promise) {
	var ok = true;
    var m = res.match(/>([^<]*)<br \/><br \/><a href="\/viewtopic\?(?:start=([0-9]+)&amp;)?t=([0-9]+)&amp;topic_name#([0-9]+)">[^<]*<\/a><br \/><br \/><a href="\/f([0-9]+)-([^"]*)">/);
    if (!m) {
      var m = res.match(/>([^<]*)<br \/><br \/><a href="\/t([0-9]+)-([^"]*)">[^<]*<\/a><br [\\\/]><br [\\\/]><a href="\/f([0-9]+)-([^"]*)">/);
      if(!m) {
        var m = res.match(/>([^<]*)<br \/><br \/><a href="\/t([0-9]+)-([^"]*)"(?: class="gen")?>[^<]*<\/a>(?:<br [\\\/]><br [\\\/]><a href="(\/(?:forum)?)" class="gen">|<\/p>)/);
        if(!m) {
          var m = res.match(/>([^<]*)<br \/><br \/><a href="\/f([0-9]+)-([^"]*)">/) || res.match(/>([^<]*)<br \/><br \/><a href="\/privmsg\?folder=inbox">/) || res.match(/>([^<]*)<br \/><br \/><a href="\/u([0-9]+)">/) || res.match(/<\/h3><\/center><p>([^<]*)<\/p><\/div><h2>/)
          if(!m) {
            var ok = false;
            var m = res.match(/>([^<]*)<br \/><br \/><a href="\/viewtopic\?f&amp;t&amp;topic_name=topic">/)|| res.match(/(?: class="row1"><span class="gen">|<div class="main-content"><p class="center">|<p class="center" style="color: red;">|<div class="box-content error"><p>|<p class="center" style="color: red;"><font color="red">)((?:[^<]*(?:<br \/>)?)+)(?:<\/p>|<\/font><\/p>|<\/span>)/) || res.match(/(?:<h1 class="page-title">[^<]*<\/h1><p>|<div class="msg">|<\/h1><\/div><div class="main-content message"><p class="message">| align="center"><span class="gen">)([^<]*)(?:<\/p>|<\/div>|<\/span><\/td>)/) || [0, ""];
          }
        }
      };
    }
    /* work on matches */
};

FA_OBJECT.prototype.isUserLoggedIn = function() {
	if (!this._m.user().logged) return new Error('Action invité impossible');
};


/* FORUM OBJECT INSTANCE */
function FA_FORUM() {
	FA_OBJECT.apply(this, arguments);
}
FA_FORUM.prototype = Object.create(FA_OBJECT.prototype);

// MONOMER.forum(forum_id).post( [subject [, message ]] [, object ] ) - post new topic
FA_FORUM.prototype.post = function() {
	this.isUserLoggedIn(); // abort

	let required = ['subject', 'message'];
	var data = this.requiredArguments(arguments, required);
	let body = Object.assign({
		notify: 0,
		mode: 'newtopic',
  		f: this._instance_id,
  		post: 1
	}, data);

	/*const formData = new URLSearchParams(new FormData(body));*/
	
	this.fetcher('/post', {
		method: 'POST'
	}, body).then(e => e.text())
	.then((res) => this.fetcherFeedback(res));
	
};

/* TOPIC OBJECT INSTANCE */
function FA_TOPIC() {
	FA_OBJECT.apply(this, arguments);
}

FA_TOPIC.prototype = Object.create(FA_OBJECT.prototype);

// MONOMER.topic(topic_id).delete() - delete topic
// return promise
FA_TOPIC.prototype.delete = function() {
	this.isUserLoggedIn(); // abort
	let body = {
		mode: 'delete',
  		t: this._instance_id,
  		confirm: 1,
  		tid: this._tid
	};

	return this.fetcher("/modcp?tid=" + this._tid, {
		method: 'POST'
	}, body).then(e => e.text());
};


/* LOGIN OBJECT INSTANCE */
function FA_LOGIN() {
	this.username = arguments[0][0];
	this.password = arguments[0][1];
	this._m = arguments[1];
	let body = {
		username: this.username,
  		password: this.password,
  		autologin: 1,
  		login: 1
	};

	return new Fetcher("/login", {
		method: 'POST'
	}, body).then(r => r.text())
	.then(function(html) {
		if(html.indexOf("Vous avez spécifié un nom d'utilisateur incorrect ou inactif ou un mot de passe invalide") >= 0) {
			throw new Error('Something went wrong');
		} else {
			return {
				status: true,
				data: html
			};
		}
	}).catch(function(error) {
		return {
			status: false,
			data: ''
		};
	});
}

/* LOGOUT OBJECT INSTANCE */
function FA_LOGOUT(monomer) {
	this._m = monomer;
	this.logout = document.querySelector('#logout').href;

	return fetch(this.logout);
}


/* FETCHER */

function Fetcher(url, options, body) {
	/* new fetch facade with defaults */
	if(window.fetch) {
		return fetch(url, this.fetchOptions(options, body));
	} else {
		// to do, fallback with straight ajax? with axios?
		return new Error("Fetch API not found.");
	}
}

Fetcher.prototype.fetchOptions = function(options, body) {
	/* setup default headers and parse of body for FA */
	const update = { ...options };
	update.headers = {
		...update.headers,
		'Content-Type': 'application/x-www-form-urlencoded'
	}
	update.body = this.bodyData(body);
	return update;
};


Fetcher.prototype.toFormData = function(obj) {
	var form_data = new FormData();

	for ( var key in obj ) {
    	form_data.append(key, obj[key]);
	}
	return form_data;
};

Fetcher.prototype.encodeFormData = function(data) {
	return [...data.entries()].map(x => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`).join('&');
};

Fetcher.prototype.bodyData = function(obj) {
	// compatible data for FA with fetch
	return this.encodeFormData(this.toFormData(obj));
};


// Modal Facade
function MONOMER_MODAL(options = {}) {
	// element references
	this.closeButton = null;
	this.modal = null;
	this.overlay = null;

	// options defaults
	var defaults = {
		className: '',
		closeButton: true,
		content: "",
		maxWidth: 600,
		minWidth: 280,
		overlay: true
	};

	if(arguments[0] && typeof arguments[0] == "object") {
		this.options = Object.assign({}, defaults, options);
	} else {
		this.options = defaults;
	}

	this.transitionEnd = transitionSelect();
}

MONOMER_MODAL.prototype.open = function() {

	// Build out our Modal
	buildOut.call(this);

    // Initialize our event listeners
    initializeEvents.call(this);

	window.getComputedStyle(this.modal).height;

	this.modal.className = this.modal.className +
  		(this.modal.offsetHeight > window.innerHeight ?
    	" monomer-open monomer-anchored" : " monomer-open");

	this.overlay.className = this.overlay.className + " monomer-open";

};

MONOMER_MODAL.prototype.close = function() {
    // Store the value of this
    var _ = this;

    // Remove the open class name
    this.modal.className = this.modal.className.replace(" monomer-open", "");
    this.overlay.className = this.overlay.className.replace(" monomer-open", "");

    /*
     * Listen for CSS transitionend event and then
     * Remove the nodes from the DOM
     */
    this.modal.addEventListener(this.transitionEnd, function() {
      _.modal.parentNode.removeChild(_.modal);
    });
    this.overlay.addEventListener(this.transitionEnd, function() {
      if(_.overlay.parentNode) _.overlay.parentNode.removeChild(_.overlay);
    });
}

// extend default
function extendDefaults(a, b){
    for(var key in b)
        if(b.hasOwnProperty(key))
            a[key] = b[key];
    return a;
}

function buildOut() {
	var content, contentHolder, docFrag;

	if(typeof this.options.content === 'string' || typeof this.options.content === 'object') {
		content = this.options.content;
	}  else {
		content = this.options.content.innerHTML;
	}

	docFrag = document.createDocumentFragment();

	this.modal = document.createElement("div");
	this.modal.className = "monomer-modal " + this.options.className;
	this.modal.style.minWidth = this.options.minWidth + "px";
	this.modal.style.maxWidth = this.options.maxWidth + "px";

	// If closeButton option is true, add a close button
    if (this.options.closeButton === true) {
      this.closeButton = document.createElement("button");
      this.closeButton.className = "monomer-close close-button";
      this.closeButton.innerHTML = "×";
      this.modal.appendChild(this.closeButton);
    }

    // If overlay is true, add one
    if (this.options.overlay === false) {
      this.overlay = document.createElement("div");
      this.overlay.className = "monomer-overlay " + this.options.className;
      docFrag.appendChild(this.overlay);
    }

    // Create content area and append to modal
    contentHolder = document.createElement("div");
    contentHolder.className = "monomer-modal__content";
    contentHolder.appendChild(content);
    this.modal.appendChild(contentHolder);

    // Append modal to DocumentFragment
    docFrag.appendChild(this.modal);

    // Append DocumentFragment to body
    document.body.appendChild(docFrag);
}

function initializeEvents() {

	if(this.closeButton) {
  		this.closeButton.addEventListener('click', this.close.bind(this));
	}

	if(this.overlay) {
  		this.overlay.addEventListener('click', this.close.bind(this));
	}

}

function transitionSelect() {
    var el = document.createElement("div");
    if (el.style.WebkitTransition) return "webkitTransitionEnd";
    if (el.style.OTransition) return "oTransitionEnd";
    return 'transitionend';
}




 

var _bridge_post_deferred = function(c, d) {
    var ok = true;
    var m = res.match(/>([^<]*)<br \/><br \/><a href="\/viewtopic\?(?:start=([0-9]+)&amp;)?t=([0-9]+)&amp;topic_name#([0-9]+)">[^<]*<\/a><br \/><br \/><a href="\/f([0-9]+)-([^"]*)">/);
    if (!m) {
      var m = c.match(/>([^<]*)<br \/><br \/><a href="\/t([0-9]+)-([^"]*)">[^<]*<\/a><br [\\\/]><br [\\\/]><a href="\/f([0-9]+)-([^"]*)">/);
      if(!m) {
        var m = c.match(/>([^<]*)<br \/><br \/><a href="\/t([0-9]+)-([^"]*)"(?: class="gen")?>[^<]*<\/a>(?:<br [\\\/]><br [\\\/]><a href="(\/(?:forum)?)" class="gen">|<\/p>)/);
        if(!m) {
          var m = c.match(/>([^<]*)<br \/><br \/><a href="\/f([0-9]+)-([^"]*)">/) || c.match(/>([^<]*)<br \/><br \/><a href="\/privmsg\?folder=inbox">/) || c.match(/>([^<]*)<br \/><br \/><a href="\/u([0-9]+)">/) || c.match(/<\/h3><\/center><p>([^<]*)<\/p><\/div><h2>/)
          if(!m) {
            var ok= false;
            var m = c.match(/>([^<]*)<br \/><br \/><a href="\/viewtopic\?f&amp;t&amp;topic_name=topic">/)|| c.match(/(?: class="row1"><span class="gen">|<div class="main-content"><p class="center">|<p class="center" style="color: red;">|<div class="box-content error"><p>|<p class="center" style="color: red;"><font color="red">)((?:[^<]*(?:<br \/>)?)+)(?:<\/p>|<\/font><\/p>|<\/span>)/) || c.match(/(?:<h1 class="page-title">[^<]*<\/h1><p>|<div class="msg">|<\/h1><\/div><div class="main-content message"><p class="message">| align="center"><span class="gen">)([^<]*)(?:<\/p>|<\/div>|<\/span><\/td>)/) || [0, ""];
          }
        }
      };
    }
    if(!ok)  d.reject({ ok: ok, content: c, message: m[1].replace('<br />', "\n") });
    else {
     var ret = {ok:true, content:c, message:m[1], forum_id:parseInt(m.slice(-2,-1)[0]), forum_seo_name:m.slice(-1)[0], forum_url:'/f'+m.slice(-2).join('-')};
     switch(m.length){
      case 7:
        $.extend(ret, {page:parseInt(m[2]||0),topic_id:parseInt(m[3]),post_id:parseInt(m[4]),post_url: '/t'+m[3]+(m[2]?"p"+m[2]:"")+"-#"+m[4], topic_url: '/t'+m[3]+'-'}); break;
      case 6:
        $.extend(ret, {topic_id:parseInt(m[2]),topic_seo_name:m[3], topic_url: '/t'+m[2]+'-'+m[3]}); break;
      case 5:
        delete ret['forum_id']; delete ret['forum_seo_name']; delete ret['forum_url'];
        $.extend(ret, {topic_id:parseInt(m[2]),topic_seo_name:m[3], topic_url: '/t'+m[2]+'-'+m[3]}); break
      case 3:
        ret = {ok:true, content:c, message:m[1], user_id:parseInt(m[2])} 
      case 2:
        ret = {ok:true, content:c, message:m[1]} 
      }
      d.resolve(ret)
    }
  };

(function(document, EventTarget) {
  var elementProto = window.Element.prototype,
      matchesFn = elementProto.matches;

  /* Check various vendor-prefixed versions of Element.matches */
  if(!matchesFn) {
    ['webkit', 'ms', 'moz'].some(function(prefix) {
      var prefixedFn = prefix + 'MatchesSelector';
      if(elementProto.hasOwnProperty(prefixedFn)) {
        matchesFn = elementProto[prefixedFn];
        return true;
      }
    });
  }

  /* Traverse DOM from event target up to parent, searching for selector */
  function passedThrough(event, selector, stopAt) {
    var currentNode = event.target;

    while(true) {
      if(matchesFn.call(currentNode, selector)) {
        return currentNode;
      }
      else if(currentNode != stopAt && currentNode != document.body) {
        currentNode = currentNode.parentNode;
      }
      else {
        return false;
      }
    }
  }

  /* Extend the EventTarget prototype to add a delegateEventListener() event */
  EventTarget.prototype.delegateEventListener = function(eName, toFind, fn) {
    this.addEventListener(eName, function(event) {
      var found = passedThrough(event, toFind, event.currentTarget);

      if(found) {
        // Execute the callback with the context set to the found element
        // jQuery goes way further, it even has it's own event object
        fn.call(found, event);
      }
    });
  };

}(window.document, window.EventTarget || window.Element));

/* virtual domtop first attempt */
let VD = {
	h(type, props, ...children) { 
		return { type, props: props || {}, children } 
	},
	createElement(node) {
		if (typeof node === "string") {
	    	return document.createTextNode(node);
	  	}
	  	const $el = document.createElement(node.type);
	  	VD.setProps($el, node.props);
	  	VD.addEventListeners($el, node.props);
	  	node.children
	  		.map(VD.createElement)
	  		.forEach($el.appendChild.bind($el));
	  	return $el;
	},
	updateElement($parent, newNode, oldNode, index = 0) {
		if (!oldNode) {
			$parent.appendChild(
				VD.createElement(newNode)
			);
		} else if (!newNode) {
			$parent.removeChild(
				$parent.childNodes[index]
			);
		} else if (VD.changed(newNode, oldNode)) {
			$parent.replaceChild(
				VD.createElement(newNode),
				$parent.childNodes[index]
			);
		} else if (newNode.type) {
			VD.updateProps(
				$parent.childNodes[index],
				newNode.props,
				oldNode.props
			);
			const newLength = newNode.children.length;
			const oldLength = oldNode.children.length;
			for (let i = 0; i < newLength || i < oldLength; i++) {
				VD.updateElement(
					$parent.childNodes[index], //parent
					newNode.children[i], // new node
					oldNode.children[i], // old node
					i // index
				);
			}
		}
	},
	changed(node1, node2) {
		return typeof node1 !== typeof node2 ||
			typeof node1 === 'string' && node1 !== node2 ||
			node1.type !== node2.type ||
			node1.props && node1.props.forceUpdate
	},
	setProp($target, name, value) {
		if (VD.isCustomProp(name)) {
			return;
		} else if (name === 'className') {
			$target.setAttribute('class', value);
		} else if (typeof value === 'boolean') {
			VD.setBooleanProp($target, name, value);
		} else {
			$target.setAttribute(name, value);
		}
	},
	removeProp($target, name, value) {
		if (VD.isCustomProp(name)) {
			return;
		} else if (name === 'className') {
			$target.removeAttribute('class');
		} else if (typeof value === 'boolean') {
			VD.removeBooleanProp($target, name);
		} else {
			$target.removeAttribute(name);
		}
	},
	setBooleanProp($target, name, value) {
		if (value) {
			$target.setAttribute(name, value);
			$target[name] = true;
		} else {
			$target[name] = false;
		}
	},
	removeBooleanProp($target, name) {
		$target.removeAttribute(name);
		$target[name] = false;
	},
	isCustomProp(name) {
		return VD.isEventProp(name) || name === 'forceUpdate';
	},
	isEventProp(name) {
		return /^on/.test(name);
	},
	setProps($target, props) {
		Object.keys(props).forEach(name => {
			VD.setProp($target, name, props[name]);
		});
	},
	updateProp($target, name, newVal, oldVal) {
		if(!newVal) {
			VD.removeProp($target, name, oldVal);
		} else if (!oldVal || newVal !== oldVal) {
			VD.setProp($target, name, newVal);
		}
	},
	updateProps($target, newProps, oldProps = {}) {
		const props = Object.assign({}, newProps, oldProps);
		Object.keys(props).forEach(name => {
			VD.updateProp($target, name, newProps[name], oldProps[name]);
		});
	},
	extractEventName(name) {
		return name.slice(2).toLowerCase();
	},
	addEventListeners($target, props) {
		Object.keys(props).forEach(name => {
			if(VD.isEventProp(name)) {
				$target.addEventListener(
					VD.extractEventName(name),
					props[name]
				);
			}
		});
	}
};
