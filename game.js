// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 100, 1000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;
document.body.appendChild(renderer.domElement);

// Player object
const player = {
    position: new THREE.Vector3(0, 1, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    speed: 0.3,
    jumpForce: 0.5,
    isJumping: false,
    gravity: 0.015
};

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Mouse look (first-person camera)
let pitch = 0;
let yaw = 0;
const mouseSensitivity = 0.005;
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        yaw -= e.movementX * mouseSensitivity;
        pitch -= e.movementY * mouseSensitivity;
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
    }
});

// Lock pointer on click
document.addEventListener('click', () => {
    document.body.requestPointerLock();
});

// Create ground
const groundGeometry = new THREE.PlaneGeometry(200, 200);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Create some terrain obstacles
function createObstacle(x, z, width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
}

// Add some obstacles
createObstacle(10, 10, 5, 3, 5);
createObstacle(-15, 5, 4, 4, 4);
createObstacle(0, 20, 6, 2, 6);

// Create a player character (capsule-like shape)
function createPlayer() {
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff6b6b });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.2;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);
    
    return group;
}

const playerMesh = createPlayer();
playerMesh.position.copy(player.position);
scene.add(playerMesh);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 50, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.far = 200;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
scene.add(directionalLight);

// Game loop
function update() {
    // Movement
    const moveDirection = new THREE.Vector3();
    
    if (keys['w']) moveDirection.z -= 1;
    if (keys['s']) moveDirection.z += 1;
    if (keys['a']) moveDirection.x -= 1;
    if (keys['d']) moveDirection.x += 1;
    
    // Rotate movement based on camera direction
    moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    moveDirection.normalize();
    
    player.velocity.x = moveDirection.x * player.speed;
    player.velocity.z = moveDirection.z * player.speed;
    
    // Gravity
    player.velocity.y -= player.gravity;
    
    // Jump
    if (keys[' '] && !player.isJumping && player.position.y <= 1.01) {
        player.velocity.y = player.jumpForce;
        player.isJumping = true;
    }
    if (!keys[' ']) {
        player.isJumping = false;
    }
    
    // Apply velocity
    player.position.add(player.velocity);
    
    // Ground collision
    if (player.position.y <= 1) {
        player.position.y = 1;
        player.velocity.y = 0;
    }
    
    // Update player mesh position
    playerMesh.position.copy(player.position);
    
    // Update camera (first-person view above player)
    camera.position.x = player.position.x;
    camera.position.y = player.position.y + 0.6;
    camera.position.z = player.position.z;
    
    // Update camera rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    
    // Update UI
    document.getElementById('posX').textContent = player.position.x.toFixed(1);
    document.getElementById('posY').textContent = player.position.y.toFixed(1);
    document.getElementById('posZ').textContent = player.position.z.toFixed(1);
}

function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game
animate();
