

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// create the smooth scroller FIRST!
let smoother = ScrollSmoother.create({
  smooth: 2,
  effects: true,
  normalizeScroll: true
});

// pin shape when it reaches the center of the viewport, for 300px
ScrollTrigger.create({
  trigger: ".shape",
  pin: true,
  start: "center center",
  end: "+=300"
});

document.querySelector("button").addEventListener("click", (e) => {
  // scroll to the spot where the shape is in the center.
  // parameters: element, smooth, position
  smoother.scrollTo(".shape", true, "center center");

  // or you could animate the scrollTop:
  // gsap.to(smoother, {
  //  scrollTop: smoother.offset(".shape", "center center"),
  //  duration: 1
  // });
});
