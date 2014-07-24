# Chaining #

Clean up callback hell. All calls are currently sequential.

```javascript
function sendRequest(url, callback) {
    $.get(url, function(response) {
        callback(response);
    });
}

chain(sendRequest, "http://www.rootof.com/")
.then(function(response, next) {
    // `.then` passes the previous callbacks params
    console.log(response);
})
.and(function(next) {
    // `.and` does not pass any parameters from previous call
    next(1);
})
.thenSync(function(param) {
    // `.thenSync` does not need `next()` call
    console.log(param + 1);
})
.andSync(function() {
    // `.andSync` does not need `next()` call
})
.and(function(next) {
    // return `chain.exit` to stop a chain
    return chain.exit;
})
.and(function(next) {
    // Will not get called
});

chain(sendRequest, "http://www.api.com/")
.then(sendRequest, "http://www.foo.com/")
.then(sendRequest, "http://www.bar.com/")
.end(function() {
    console.log("They are done");
})
```