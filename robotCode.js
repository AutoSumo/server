(async () => {
    var i;


    for (i = 0; i <= 10; i++) {
        await moveMotors((i * 10), (i * 10));
        await waitSeconds(1);
    }
})();
