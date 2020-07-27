module.exports = function syncFor(index, len, status, func) {
    func(index, status, function (res) {
        if (res == "next") {
            index++;
            console.log("SyncFor: increased index now, " + index);
            if (index < len) {
                syncFor(index, len, "r", func);
                console.log("SyncFor: index = " + index + " less than " + len);
            } else {
                console.log("SyncFor: done at index = " + index + " less than " + len);
                return func(index, "done", function () {
                })
            }
        }
    });
}

