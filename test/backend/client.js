function ServerSentEvent(path) {
    if (path[0] !== '/') {
        path = '/' + path;
    }

    this.source = new EventSource(path);
    this.events = {};
}

ServerSentEvent.prototype.on = function (name, callback) {
    if (typeof name === 'callback') {
        callback = name;
        name     = 'message';
    }

    var callbackWrapper = function(e) {
        callback(e.data, e);
    };

    var callbackObj = {
        callback : callback,
        wrapper : callbackWrapper
    };

    if (!this.events[name]) {
        this.events[name] = [callbackObj];
    } else {
        this.events[name].push(callbackObj);
    }

    this.source.addEventListener(name, callbackWrapper, false);
};

ServerSentEvent.prototype.once = function (name, callback) {
    var self = this;

    if (typeof name === 'callback') {
        callback = name;
        name     = 'message';
    }

    var callbackWrapper = function(e) {
        callback(e.data, e);
        self.removeListener(name, callbackWrapper);
    };

    this.source.addEventListener(name, callbackWrapper, false);
};

ServerSentEvent.prototype.removeListener = function (name, callback) {
    if (typeof name === 'callback') {
        callback = name;
        name     = 'message';
    }

    var pos,
        events = this.events[name];

    if (events) {
        for (var i = 0, l = events.length; i < l; i++) {
            if (events[i].callback === callback) {
                pos = i;
                break;
            }
        }
    }

    if (pos) {
        callback = events[pos].wrapper;
        events.splice(pos, 1);
    }

    this.source.removeEventListener(name, callback, false);
};

ServerSentEvent.prototype.removeAllListeners = function (name) {
    if (name) {
        this.removeListenersByName(name);
        this.events[name] = null;
    } else {
        for (var key in this.events) {
            this.removeListenersByName(key);
        }

        this.events = {};
    }
};

ServerSentEvent.prototype.removeListenersByName = function (name) {
    var events = this.events[name];

    if (!events) {
        return;
    }

    for (var i = 0, l = events.length; i < l; i++) {
        this.source.removeEventListener(name, events[i].wrapper, false);
    }
};