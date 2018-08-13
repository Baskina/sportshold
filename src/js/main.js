;"use strict";

document.addEventListener("DOMContentLoaded", function () {

    var burgerFirst = document.getElementsByClassName("burger")[0];
    var burgerSecond = document.getElementsByClassName("burger")[1];

    burgerFirst.addEventListener("click", function () {
        burgerFirst.classList.toggle("burger_open");
    });

    burgerSecond.addEventListener("click", function () {
        burgerSecond.classList.toggle("burger_open");
    });
});