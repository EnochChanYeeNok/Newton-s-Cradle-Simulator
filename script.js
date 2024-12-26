// script.js

const canvas = document.getElementById('pendulumCanvas');
const ctx = canvas.getContext('2d');

// Scaling factor
const scale = 100; // pixels per meter for better visibility

// Origin point
const originX = canvas.width / 2;
const originY = 50; // Top padding

// Pendulum array to hold all pendulum objects
let pendulums = [];

// Physics parameters
let gravity = 9.81; // in m/s²
let damping = 0.02;
let paused = true;
let lastTimestamp = 0;

// Maximum number of pendulums
const MAX_PENDULUMS = 6;

// DOM Elements
const pendulumTableBody = document.querySelector('#pendulumTable tbody');
const addPendulumBtn = document.getElementById('addPendulumBtn');
const gravityInput = document.getElementById('gravity');
const dampingInput = document.getElementById('damping');
const startBtn = document.getElementById('startBtn');

// Initialize with two pendulums
addPendulum();
addPendulum();

// Function to add a new pendulum
function addPendulum() {
    if (pendulums.length >= MAX_PENDULUMS) {
        alert(`Maximum of ${MAX_PENDULUMS} pendulums reached.`);
        return;
    }
    const pendulumIndex = pendulums.length + 1;
    const pendulum = {
        length: 1.5, // meters
        mass: 20, // kg
        angle: 90 * Math.PI / 180, // radians
        angularVelocity: 0, // radians/s
        angularAcceleration: 0, // radians/s²
    };
    pendulums.push(pendulum);
    renderPendulumRow(pendulumIndex, pendulum);
}

// Function to remove a pendulum
function removePendulum(index) {
    pendulums.splice(index, 1);
    renderPendulumTable();
}

// Function to render the pendulum table
function renderPendulumTable() {
    pendulumTableBody.innerHTML = '';
    pendulums.forEach((pendulum, index) => {
        renderPendulumRow(index + 1, pendulum);
    });
}

// Function to render a single pendulum row
function renderPendulumRow(index, pendulum) {
    const row = document.createElement('tr');

    // Pendulum Number
    const pendulumNumber = document.createElement('td');
    pendulumNumber.textContent = `Pendulum ${index}`;
    row.appendChild(pendulumNumber);

    // Length
    const lengthCell = document.createElement('td');
    const lengthInput = document.createElement('input');
    lengthInput.type = 'number';
    lengthInput.min = '0.1';
    lengthInput.max = '10';
    lengthInput.value = pendulum.length;
    lengthInput.step = '0.1';
    lengthInput.addEventListener('input', () => {
        pendulum.length = parseFloat(lengthInput.value);
    });
    lengthCell.appendChild(lengthInput);
    row.appendChild(lengthCell);

    // Mass
    const massCell = document.createElement('td');
    const massInput = document.createElement('input');
    massInput.type = 'number';
    massInput.min = '1';
    massInput.max = '100';
    massInput.value = pendulum.mass;
    massInput.step = '1';
    massInput.addEventListener('input', () => {
        pendulum.mass = parseFloat(massInput.value);
    });
    massCell.appendChild(massInput);
    row.appendChild(massCell);

    // Angle
    const angleCell = document.createElement('td');
    const angleInput = document.createElement('input');
    angleInput.type = 'range';
    angleInput.min = '-180';
    angleInput.max = '180';
    angleInput.value = (pendulum.angle * 180 / Math.PI).toFixed(0);
    angleInput.step = '1';
    angleInput.addEventListener('input', () => {
        pendulum.angle = parseFloat(angleInput.value) * Math.PI / 180;
    });
    angleCell.appendChild(angleInput);
    row.appendChild(angleCell);

    // Remove Button
    const removeCell = document.createElement('td');
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.classList.add('remove-btn');
    removeBtn.addEventListener('click', () => {
        removePendulum(index - 1);
    });
    removeCell.appendChild(removeBtn);
    row.appendChild(removeCell);

    pendulumTableBody.appendChild(row);
}

// Event listener for adding a pendulum
addPendulumBtn.addEventListener('click', addPendulum);

// Event listeners for gravity and damping
gravityInput.addEventListener('input', () => {
    gravity = parseFloat(gravityInput.value);
});
dampingInput.addEventListener('input', () => {
    damping = parseFloat(dampingInput.value);
});

// Start button
startBtn.addEventListener('click', () => {
    // Reset velocities and accelerations
    pendulums.forEach(p => {
        p.angularVelocity = 0;
        p.angularAcceleration = 0;
    });

    // Reset timestamp
    lastTimestamp = performance.now();

    // Toggle pause
    paused = !paused;
    if (!paused) {
        requestAnimationFrame(animate);
        startBtn.textContent = 'Pause';
    } else {
        startBtn.textContent = 'Start';
    }
});

// Function to compute the equations of motion
function updatePhysics(deltaTime) {
    const n = pendulums.length;

    if (n === 1) {
        // Single Pendulum
        const p = pendulums[0];
        p.angularAcceleration = (-gravity / p.length) * Math.sin(p.angle) - damping * p.angularVelocity;
    } else if (n === 2) {
        // Double Pendulum
        const p1 = pendulums[0];
        const p2 = pendulums[1];

        const sin1 = Math.sin(p1.angle);
        const sin2 = Math.sin(p2.angle);
        const sin12 = Math.sin(p1.angle - p2.angle);
        const cos12 = Math.cos(p1.angle - p2.angle);

        const denom1 = (2 * p1.mass + p2.mass - p2.mass * Math.cos(2 * p1.angle - 2 * p2.angle));
        p1.angularAcceleration = (-gravity * (2 * p1.mass + p2.mass) * sin1 
            - p2.mass * gravity * Math.sin(p1.angle - 2 * p2.angle)
            - 2 * sin12 * p2.mass * (p2.angularVelocity * p2.angularVelocity * p2.length + p1.angularVelocity * p1.angularVelocity * p1.length * cos12))
            / (p1.length * denom1);

        const denom2 = (2 * p1.mass + p2.mass - p2.mass * Math.cos(2 * p1.angle - 2 * p2.angle));
        p2.angularAcceleration = (2 * sin12 * (p1.angularVelocity * p1.angularVelocity * p1.length * (p1.mass + p2.mass)
            + gravity * (p1.mass + p2.mass) * Math.cos(p1.angle)
            + p2.angularVelocity * p2.angularVelocity * p2.length * p2.mass * cos12))
            / (p2.length * denom2);
    } else if (n === 3) {
        // Triple Pendulum
        const p1 = pendulums[0];
        const p2 = pendulums[1];
        const p3 = pendulums[2];

        const sin1 = Math.sin(p1.angle);
        const sin2 = Math.sin(p2.angle);
        const sin3 = Math.sin(p3.angle);
        const cos1 = Math.cos(p1.angle);
        const cos2 = Math.cos(p2.angle);
        const cos3 = Math.cos(p3.angle);
        const sin12 = Math.sin(p1.angle - p2.angle);
        const sin23 = Math.sin(p2.angle - p3.angle);
        const cos12 = Math.cos(p1.angle - p2.angle);
        const cos23 = Math.cos(p2.angle - p3.angle);

        const denom = 2 * p1.mass + p2.mass + p3.mass;

        p1.angularAcceleration = (-gravity * denom * sin1
            - p2.mass * gravity * Math.sin(p1.angle - 2 * p2.angle)
            - p3.mass * gravity * Math.sin(p1.angle - 2 * p3.angle)
            - 2 * sin12 * p2.mass * (p2.angularVelocity * p2.angularVelocity * p2.length + p1.angularVelocity * p1.angularVelocity * p1.length * cos12))
            / (p1.length * denom);

        p2.angularAcceleration = (2 * sin12 * (p1.angularVelocity * p1.angularVelocity * p1.length * (p1.mass + p2.mass)
            + gravity * (p1.mass + p2.mass) * cos1
            + p2.angularVelocity * p2.angularVelocity * p2.length * p2.mass * cos12))
            / (p2.length * denom);

        p3.angularAcceleration = (2 * sin23 * (p2.angularVelocity * p2.angularVelocity * p2.length * (p2.mass + p3.mass)
            + gravity * (p2.mass + p3.mass) * cos2
            + p3.angularVelocity * p3.angularVelocity * p3.length * p3.mass * cos23))
            / (p3.length * denom);
    } else if (n === 4) {
        // Quadruple Pendulum (Simplified Physics)
        const p1 = pendulums[0];
        const p2 = pendulums[1];
        const p3 = pendulums[2];
        const p4 = pendulums[3];

        // Simplified physics: Each pendulum interacts only with its immediate neighbor
        // Accurate interactions require complex equations derived from Lagrangian mechanics

        // Pendulum 1
        const sin1 = Math.sin(p1.angle);
        const sin2 = Math.sin(p2.angle);
        const sin12 = Math.sin(p1.angle - p2.angle);
        const cos12 = Math.cos(p1.angle - p2.angle);

        const sin3 = Math.sin(p3.angle);
        const sin23 = Math.sin(p2.angle - p3.angle);
        const cos23 = Math.cos(p2.angle - p3.angle);

        const sin4 = Math.sin(p4.angle);
        const sin34 = Math.sin(p3.angle - p4.angle);
        const cos34 = Math.cos(p3.angle - p4.angle);

        const denom = 2 * p1.mass + p2.mass + p3.mass + p4.mass;

        p1.angularAcceleration = (-gravity * denom * sin1
            - p2.mass * gravity * Math.sin(p1.angle - 2 * p2.angle)
            - p3.mass * gravity * Math.sin(p1.angle - 2 * p3.angle)
            - p4.mass * gravity * Math.sin(p1.angle - 2 * p4.angle)
            - 2 * sin12 * p2.mass * (p2.angularVelocity * p2.angularVelocity * p2.length + p1.angularVelocity * p1.angularVelocity * p1.length * cos12))
            / (p1.length * denom);

        p2.angularAcceleration = (2 * sin12 * (p1.angularVelocity * p1.angularVelocity * p1.length * (p1.mass + p2.mass)
            + gravity * (p1.mass + p2.mass) * Math.cos(p1.angle)
            + p2.angularVelocity * p2.angularVelocity * p2.length * p2.mass * cos12))
            / (p2.length * denom);

        p3.angularAcceleration = (2 * sin23 * (p2.angularVelocity * p2.angularVelocity * p2.length * (p2.mass + p3.mass)
            + gravity * (p2.mass + p3.mass) * Math.cos(p2.angle)
            + p3.angularVelocity * p3.angularVelocity * p3.length * p3.mass * cos23))
            / (p3.length * denom);

        p4.angularAcceleration = (2 * sin34 * (p3.angularVelocity * p3.angularVelocity * p3.length * (p3.mass + p4.mass)
            + gravity * (p3.mass + p4.mass) * Math.cos(p3.angle)
            + p4.angularVelocity * p4.angularVelocity * p4.length * p4.mass * cos34))
            / (p4.length * denom);
    } else if (n === 5) {
        // Quintuple Pendulum (Simplified Physics)
        const p1 = pendulums[0];
        const p2 = pendulums[1];
        const p3 = pendulums[2];
        const p4 = pendulums[3];
        const p5 = pendulums[4];

        // Simplified physics: Each pendulum interacts only with its immediate neighbor
        // Accurate interactions require complex equations derived from Lagrangian mechanics

        // Pendulum 1
        const sin1 = Math.sin(p1.angle);
        const sin2 = Math.sin(p2.angle);
        const sin12 = Math.sin(p1.angle - p2.angle);
        const cos12 = Math.cos(p1.angle - p2.angle);

        const sin3 = Math.sin(p3.angle);
        const sin23 = Math.sin(p2.angle - p3.angle);
        const cos23 = Math.cos(p2.angle - p3.angle);

        const sin4 = Math.sin(p4.angle);
        const sin34 = Math.sin(p3.angle - p4.angle);
        const cos34 = Math.cos(p3.angle - p4.angle);

        const sin5 = Math.sin(p5.angle);
        const sin45 = Math.sin(p4.angle - p5.angle);
        const cos45 = Math.cos(p4.angle - p5.angle);

        const denom = 2 * p1.mass + p2.mass + p3.mass + p4.mass + p5.mass;

        p1.angularAcceleration = (-gravity * denom * sin1
            - p2.mass * gravity * Math.sin(p1.angle - 2 * p2.angle)
            - p3.mass * gravity * Math.sin(p1.angle - 2 * p3.angle)
            - p4.mass * gravity * Math.sin(p1.angle - 2 * p4.angle)
            - p5.mass * gravity * Math.sin(p1.angle - 2 * p5.angle)
            - 2 * sin12 * p2.mass * (p2.angularVelocity * p2.angularVelocity * p2.length + p1.angularVelocity * p1.angularVelocity * p1.length * cos12))
            / (p1.length * denom);

        p2.angularAcceleration = (2 * sin12 * (p1.angularVelocity * p1.angularVelocity * p1.length * (p1.mass + p2.mass)
            + gravity * (p1.mass + p2.mass) * Math.cos(p1.angle)
            + p2.angularVelocity * p2.angularVelocity * p2.length * p2.mass * cos12))
            / (p2.length * denom);

        p3.angularAcceleration = (2 * sin23 * (p2.angularVelocity * p2.angularVelocity * p2.length * (p2.mass + p3.mass)
            + gravity * (p2.mass + p3.mass) * Math.cos(p2.angle)
            + p3.angularVelocity * p3.angularVelocity * p3.length * p3.mass * cos23))
            / (p3.length * denom);

        p4.angularAcceleration = (2 * sin34 * (p3.angularVelocity * p3.angularVelocity * p3.length * (p3.mass + p4.mass)
            + gravity * (p3.mass + p4.mass) * Math.cos(p3.angle)
            + p4.angularVelocity * p4.angularVelocity * p4.length * p4.mass * cos34))
            / (p4.length * denom);

        p5.angularAcceleration = (2 * sin45 * (p4.angularVelocity * p4.angularVelocity * p4.length * (p4.mass + p5.mass)
            + gravity * (p4.mass + p5.mass) * Math.cos(p4.angle)
            + p5.angularVelocity * p5.angularVelocity * p5.length * p5.mass * cos45))
            / (p5.length * denom);
    } else if (n === 6) {
        // Sextuple Pendulum (Simplified Physics)
        const p1 = pendulums[0];
        const p2 = pendulums[1];
        const p3 = pendulums[2];
        const p4 = pendulums[3];
        const p5 = pendulums[4];
        const p6 = pendulums[5];

        // Simplified physics: Each pendulum interacts only with its immediate neighbor
        // Accurate interactions require complex equations derived from Lagrangian mechanics

        // Pendulum 1
        const sin1 = Math.sin(p1.angle);
        const sin2 = Math.sin(p2.angle);
        const sin12 = Math.sin(p1.angle - p2.angle);
        const cos12 = Math.cos(p1.angle - p2.angle);

        const sin3 = Math.sin(p3.angle);
        const sin23 = Math.sin(p2.angle - p3.angle);
        const cos23 = Math.cos(p2.angle - p3.angle);

        const sin4 = Math.sin(p4.angle);
        const sin34 = Math.sin(p3.angle - p4.angle);
        const cos34 = Math.cos(p3.angle - p4.angle);

        const sin5 = Math.sin(p5.angle);
        const sin45 = Math.sin(p4.angle - p5.angle);
        const cos45 = Math.cos(p4.angle - p5.angle);

        const sin6 = Math.sin(p6.angle);
        const sin56 = Math.sin(p5.angle - p6.angle);
        const cos56 = Math.cos(p5.angle - p6.angle);

        const denom = 2 * p1.mass + p2.mass + p3.mass + p4.mass + p5.mass + p6.mass;

        p1.angularAcceleration = (-gravity * denom * sin1
            - p2.mass * gravity * Math.sin(p1.angle - 2 * p2.angle)
            - p3.mass * gravity * Math.sin(p1.angle - 2 * p3.angle)
            - p4.mass * gravity * Math.sin(p1.angle - 2 * p4.angle)
            - p5.mass * gravity * Math.sin(p1.angle - 2 * p5.angle)
            - p6.mass * gravity * Math.sin(p1.angle - 2 * p6.angle)
            - 2 * sin12 * p2.mass * (p2.angularVelocity * p2.angularVelocity * p2.length + p1.angularVelocity * p1.angularVelocity * p1.length * cos12))
            / (p1.length * denom);

        p2.angularAcceleration = (2 * sin12 * (p1.angularVelocity * p1.angularVelocity * p1.length * (p1.mass + p2.mass)
            + gravity * (p1.mass + p2.mass) * Math.cos(p1.angle)
            + p2.angularVelocity * p2.angularVelocity * p2.length * p2.mass * cos12))
            / (p2.length * denom);

        p3.angularAcceleration = (2 * sin23 * (p2.angularVelocity * p2.angularVelocity * p2.length * (p2.mass + p3.mass)
            + gravity * (p2.mass + p3.mass) * Math.cos(p2.angle)
            + p3.angularVelocity * p3.angularVelocity * p3.length * p3.mass * cos23))
            / (p3.length * denom);

        p4.angularAcceleration = (2 * sin34 * (p3.angularVelocity * p3.angularVelocity * p3.length * (p3.mass + p4.mass)
            + gravity * (p3.mass + p4.mass) * Math.cos(p3.angle)
            + p4.angularVelocity * p4.angularVelocity * p4.length * p4.mass * cos34))
            / (p4.length * denom);

        p5.angularAcceleration = (2 * sin45 * (p4.angularVelocity * p4.angularVelocity * p4.length * (p4.mass + p5.mass)
            + gravity * (p4.mass + p5.mass) * Math.cos(p4.angle)
            + p5.angularVelocity * p5.angularVelocity * p5.length * p5.mass * cos45))
            / (p5.length * denom);

        p6.angularAcceleration = (2 * sin56 * (p5.angularVelocity * p5.angularVelocity * p5.length * (p5.mass + p6.mass)
            + gravity * (p5.mass + p6.mass) * Math.cos(p5.angle)
            + p6.angularVelocity * p6.angularVelocity * p6.length * p6.mass * cos56))
            / (p6.length * denom);
    }
}

// Function to compute the equations of motion
function computeEquations(deltaTime) {
    updatePhysics(deltaTime);

    // Update velocities and angles with computed accelerations
    pendulums.forEach(pendulum => {
        pendulum.angularVelocity += pendulum.angularAcceleration * deltaTime;
        pendulum.angle += pendulum.angularVelocity * deltaTime;
    });
}

// Draw pendulums
function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let previousX = originX;
    let previousY = originY;

    pendulums.forEach((pendulum, index) => {
        const bobX = previousX + pendulum.length * scale * Math.sin(pendulum.angle);
        const bobY = previousY + pendulum.length * scale * Math.cos(pendulum.angle);

        // Draw rod
        ctx.beginPath();
        ctx.moveTo(previousX, previousY);
        ctx.lineTo(bobX, bobY);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw bob
        ctx.beginPath();
        ctx.arc(bobX, bobY, pendulum.mass / 5, 0, Math.PI * 2);
        ctx.fillStyle = getColor(index);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.stroke();

        // Update previous position for next pendulum
        previousX = bobX;
        previousY = bobY;
    });
}

// Helper function to get color based on pendulum index
function getColor(index) {
    const colors = ['#007BFF', '#FF4136', '#2ECC40', '#FF851B', '#B10DC9', '#FFDC00'];
    return colors[index % colors.length];
}

// Animation loop
function animate(timestamp) {
    if (!paused) {
        const deltaTime = (timestamp - lastTimestamp) / 1000; // in seconds
        lastTimestamp = timestamp;

        computeEquations(deltaTime);
        draw();
        requestAnimationFrame(animate);
    }
}

// Initial draw
draw();