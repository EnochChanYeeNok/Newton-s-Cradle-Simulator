// Number of pendulum balls
const NUM_BALLS = 5;
// Each ball's radius (used for positioning)
const BALL_RADIUS = 20;
// Length of the pendulum string (pixels)
const STRING_LENGTH = 250;
// Gravity acceleration (mimic real gravity in px/s^2 for visual scale)
const GRAVITY = 0.4;

// Arrays to store angle, angular velocity, and angular acceleration for each ball
let angles = [];
let velocities = [];
let accelerations = [];

/*
  A simple approach:
  - angles[i]: current angle of the i-th pendulum (0 = hanging straight down)
  - velocities[i]: angular velocity
  - accelerations[i]: angular acceleration
  - We detect collisions between adjacent balls by checking if their angles cross
    and they have different velocities, then swap velocities (elastic collision).
  - This is not a perfect physics simulation, but it gives a decent visual effect.
*/

// Initialize angles, velocities, accelerations
// You can tweak the initial angle for the leftmost or rightmost ball
// to see the cradle in action. Here we pull the leftmost ball out:
for (let i = 0; i < NUM_BALLS; i++) {
  if (i === 0) {
    angles[i] = 0.9; // ~51.57 degrees
  } else {
    angles[i] = 0;   // rest position
  }
  velocities[i] = 0;
  accelerations[i] = 0;
}

// Cache the ball DOM elements
const balls = [];
for (let i = 0; i < NUM_BALLS; i++) {
  balls.push(document.getElementById(`ball${i}`));
}

// The pivot x-coordinate (center above the cradle)
const pivotX = window.innerWidth / 2;
// The pivot y-coordinate (where the bar is)
const pivotY = 50;

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  for (let i = 0; i < NUM_BALLS; i++) {
    // Calculate the pendulum motion:
    // acceleration = -(g / length) * sin(angle)
    accelerations[i] = -GRAVITY * Math.sin(angles[i]);

    // Update velocity and angle
    velocities[i] += accelerations[i];
    angles[i] += velocities[i];

    // Some damping for realism
    velocities[i] *= 0.999;
  }

  // Simple collision detection between adjacent balls
  // If ball i is moving inward while i+1 is outward (or any difference),
  // and their angles are close, swap velocities (perfectly elastic).
  for (let i = 0; i < NUM_BALLS - 1; i++) {
    // The difference in angles
    let diff = Math.abs(angles[i] - angles[i + 1]);
    // If they are close enough to be touching
    // (tweak 0.05 rad if you want to fine-tune collision sensitivity)
    if (diff < 0.05) {
      // Check if they are moving toward each other
      if ((velocities[i] > 0 && velocities[i + 1] < 0 && angles[i] < angles[i + 1]) ||
          (velocities[i] < 0 && velocities[i + 1] > 0 && angles[i] > angles[i + 1])) {
        // Swap velocities
        [velocities[i], velocities[i + 1]] = [velocities[i + 1], velocities[i]];
      }
    }
  }

  // Update the DOM positions of the balls
  for (let i = 0; i < NUM_BALLS; i++) {
    // Calculate the x,y position of the ball based on the angle
    let x = pivotX + STRING_LENGTH * Math.sin(angles[i]);
    let y = pivotY + STRING_LENGTH * Math.cos(angles[i]);

    // Position the ball so its center is at (x,y)
    // offset by BALL_RADIUS so the ball is centered
    balls[i].style.left = (x - BALL_RADIUS) + "px";
    balls[i].style.top = (y - BALL_RADIUS) + "px";
  }
}

// Start the animation
animate();