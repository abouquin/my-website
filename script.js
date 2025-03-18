console.log("Script loaded!");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg'), antialias: true });

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.set(0, 50, 100); // Move camera up and back
camera.lookAt(0, 0, 0); // Ensure it looks towards the galaxy center


// Shader-based nebula with refined Perlin noise
const nebulaVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const nebulaFragmentShader = `
    varying vec2 vUv;
    uniform float time;
    
    float random(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    void main() {
        vec2 pos = vUv * 15.0 + vec2(time * 0.02, time * 0.01);
        float n = noise(pos);
        
        vec3 color = mix(vec3(0.05, 0.05, 0.2), vec3(0.4, 0.15, 0.6), n);
        gl_FragColor = vec4(color, n * 0.3);
    }
`;

const nebulaMaterial = new THREE.ShaderMaterial({
    vertexShader: nebulaVertexShader,
    fragmentShader: nebulaFragmentShader,
    uniforms: {
        time: { value: 0.0 }
    },
    transparent: true
});

const nebulaGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);

const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
nebula.position.set(0, 0, -200);
scene.add(nebula);

// Create a spiral galaxy
const galaxyGeometry = new THREE.BufferGeometry();
const galaxyVertices = [];
const galaxyColors = [];
const numStars = 5000;

const starColors = [
    [0.5, 0.4, 0.4], [0.6, 0.3, 0.3], [0.7, 0.3, 0.3], // Red stars
    [0.8, 0.5, 0.3], [0.9, 0.6, 0.2], [1.0, 0.7, 0.1], // Orange stars
    [1.0, 0.9, 0.3], [0.9, 0.8, 0.2], [1.0, 0.8, 0.0], // Yellow stars
    [0.2, 0.8, 1.0], [0.15, 0.7, 0.9], [0.1, 0.6, 0.8]  // Blue stars (kept fewer)
];

for (let i = 0; i < numStars; i++) {
    const angle = i * 0.1; // Spiral effect
    const distance = Math.sqrt(i) * 2.5;
    const x = distance * Math.cos(angle);
    const y = (Math.random() - 0.5) * 20;
    const z = distance * Math.sin(angle);

    galaxyVertices.push(x, y, z);
    galaxyColors.push(...starColors[Math.floor(Math.random() * starColors.length)]);
}

galaxyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(galaxyVertices, 3));
galaxyGeometry.setAttribute('color', new THREE.Float32BufferAttribute(galaxyColors, 3));

const galaxyMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        varying vec3 vColor;
        void main() {
            vColor = color;
            gl_PointSize = 3.0; // Increase star size
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vColor;
        void main() {
            float distanceToCenter = length(gl_PointCoord - vec2(0.5));
            float alpha = smoothstep(0.5, 0.1, distanceToCenter); // Softer glow effect
            gl_FragColor = vec4(vColor * 4.0, alpha); // Glow intensity increased
        }
    `,
    vertexColors: true,
    transparent: true
});

const galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
scene.add(galaxy);

// Handle resizing for mobile
function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (window.innerWidth < 600) {
        galaxy.position.y = -10; // Move slightly downward for better centering
    } else {
        galaxy.position.y = 0; // Reset for larger screens
    }
}

window.addEventListener('resize', onResize);
onResize();

// Mouse interactivity
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Animation
function animate() {
    requestAnimationFrame(animate);
    galaxy.rotation.y += 0.0002;
    galaxy.rotation.x += 0.0001;
    nebulaMaterial.uniforms.time.value += 0.004; // Slow it down (was 0.008)

    // Apply mouse movement to rotation
    galaxy.rotation.x = mouseY * 0.5;
    galaxy.rotation.y += mouseX * 0.002;
    nebula.position.x = mouseX * 5;
    nebula.position.y = -mouseY * 5;

    renderer.render(scene, camera);
}

animate();

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".clickable-section").forEach(section => {
        section.addEventListener("click", function () {
            window.location.href = this.dataset.url;
        });
    });

    const backButton = document.querySelector(".back-button");
    if (backButton) {
        backButton.addEventListener("click", function () {
            window.location.href = "index.html";
        });
    }
});

