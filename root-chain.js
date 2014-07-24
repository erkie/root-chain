function Chainable(func, args) {
	this.stack = [];
	this.isRunning = false;
	if ( func ) {
		this.stack.push([func, args]);
		this.run();
	}
}

Chainable.prototype.run = function() {
	this.next();
	return this;
};

// Then passes the result of the previous function into the arguments
Chainable.prototype.then = Chainable.prototype.chain = function(func) {
	return this.add(func, arguments.length > 1 ? Array.prototype.slice.call(arguments, 1) : false);
};

// And doesn't pass anything back from the previous function
Chainable.prototype.and = function(func) {
	return this.add(func, arguments.length > 1 ? Array.prototype.slice.call(arguments, 1) : []);
};

// End a chain, calls a function without any arguments at all
Chainable.prototype.end = function(func) {
	return this.add(func || function() {}, arguments.length > 1 ? Array.prototype.slice.call(arguments, 1) : [], chain.ending);
};

// A synchronous call, without worrying about callbacks
Chainable.prototype.andSync = function(func) {
	var link = this;

	return this.add(function() {
		func.apply(this, [].slice.call(arguments, 0, -1));
		link.callbackWasCalled = true;
		link.next();
	}, arguments.length > 1 ? [].slice.call(arguments, 1) : []);
};

Chainable.prototype.thenSync = function(func) {
	var link = this;

	return this.add(function() {
		func.apply(this, [].slice.call(arguments, 0, -1));
		link.callbackWasCalled = true;
		link.next();
	}, arguments.length > 1 ? [].slice.call(arguments, 1) : false);
};

Chainable.prototype.add = function(func, args, meta) {
	if ( typeof func !== "function" )
		throw new Error("func in chainable not valid callback");
	this.stack.push([func, args, meta]);
	if ( ! this.isRunning )
		this.next();
	return this;
};

Chainable.prototype.makeArgs = function(args, meta) {
	if ( meta === chain.ending )
		return args;
	args = Array.prototype.slice.call(args || []);
	args.push(this.callback.bind(this));
	return args;
};

Chainable.prototype.callback = function() {
	this.callbackWasCalled = true;
	this.currentArgs = arguments;

	if ( ! this.wasSynchronous )
		this.next();
};

/*
	Run through the chain. The algorithm is as follows:

	1. Pop from stack
	2. Run
	3. Was callback called?
	    4a. Yes? Repeat
	    4b. No?  Wait, then repeat
*/

Chainable.prototype.next = function() {
	if ( this.isAborted )
		return;

	var current = this.stack.shift();

	// Chain is now empty. Maybe something is added after this though?
	if ( ! current ) {
		this.isRunning = false;
		return;
	}

	var func = current[0], args = current[1], meta = current[2];

	this.isRunning = true;
	this.wasSynchronous = true;
	this.callbackWasCalled = false;

	var ret = func.apply(this, this.makeArgs(args || this.currentArgs, meta));

	// If a function returns the exit method of chain, stop execution
	if ( ret === chain.exit )
		return;

	if ( ! this.callbackWasCalled )
		this.wasSynchronous = false;
	else {
		this.next(); // repeat
	}
};

Chainable.prototype.abort = function() {
	this.stack = [];
	this.isAborted = true;
};

function chain(func) {
	return new Chainable(func, Array.prototype.slice.call(arguments, 1));
}

chain.exit = function() { /* exit */ };
chain.ending = function() { /* ending */ };

module.exports = chain;