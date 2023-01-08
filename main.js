
var running = false;
var energy = 0;
var displayedEnergy = -1;
var mainNode;
var mainBud;
var petals = [];
var currentOrbit;
const ENERGY_PER_CYCLE = 1;
const gameElm = document.querySelector("#game");
const trainButtonElm = document.querySelector("#train");
const upgradeSpeedButtonElm = document.querySelector("#upgradeSpeed");
const upgradeClickButtonElm = document.querySelector("#upgradeClick");
const trainButtonBarElm = document.querySelector("#train .bar");
const upgradeSpeedButtonBarElm = document.querySelector("#upgradeSpeed .bar");
const upgradeClickButtonBarElm = document.querySelector("#upgradeClick .bar");

const audioElements = [
	document.getElementById("a00"),
	document.getElementById("a01"),
	document.getElementById("a02"),
	document.getElementById("a03"),
];

const introElm = document.querySelector("#intro");
const outroElm = document.querySelector("#outro");
const cursorElm = document.querySelector("#cursor");
const progressElm = document.querySelector("#progress");

const SATELLITE_BASE_DURATION = 1.5;
const ORBIT_ORBIT_SIZE = 240;
const ORBIT_SCALE = 0.7;
const ORBIT_MAX_COUNT_MIN = 25;
const ORBIT_MAX_COUNT_SCALE = 1;

const LEAVING_TIME_MIN = 15;
const LEAVING_TIME_MAX = 25;

const TRAIN_COST_CONST = 0.1;

const SPEED_COST_CONST = 0.15;
const SPEED_UPGRADE = 0.005;
var speedUpgradeLevel = 1;

const CLICK_ENERGY_BASE = 1;
const CLICK_DAMAGE = 13;
const CLICK_COST_CONST = 0.4;
const CLICK_POWER_INCREASE = 0.4;
var clickUpgradeLevel = 1;

const BLOB_ENERGY_MULTIPLIER_CONST = 0.5;
const BLOB_SPAWN_TIMER_MIN = 5000;
const BLOB_SPAWN_TIMER_MAX = 30000;
const BLOB_MAX_COUNT = 5;

const SHADE_DAMAGE = 50;
const SHADE_BASE_HP = 50;
const SHADE_HP_SCALE = 0.05;
const SHADE_MAX_COUNT = 4;
const SHADE_SPAWN_TIMER_MIN = 15000;
const SHADE_SPAWN_TIMER_MAX = 45000;
var shadesCreated = 0;

var canSpawnShades = false;
var mouseDown = false;
var mouseClick = false;
var shiftKey = false;
var altKey = false;
var gameStartDate = null;
var gameCompleteDate = null;

const PHASE_1_THRESHOLD = 500;
const PHASE_2_THRESHOLD = 1000;
const PHASE_3_THRESHOLD = 3000;
const PHASE_4_THRESHOLD = 4500;

const PHASE_1_MIN_R = 10;
const PHASE_1_MIN_G = 10;
const PHASE_1_MIN_B = 25;
const PHASE_1_MIN_A = 1;

const PHASE_1_MAX_R = 100;
const PHASE_1_MAX_G = 100;
const PHASE_1_MAX_B = 255;
const PHASE_1_MAX_A = 1;

const PHASE_2_MIN_R = PHASE_1_MAX_R;
const PHASE_2_MIN_G = PHASE_1_MAX_G;
const PHASE_2_MIN_B = PHASE_1_MAX_B;
const PHASE_2_MIN_A = PHASE_1_MAX_A;

const PHASE_2_MAX_R = 100;
const PHASE_2_MAX_G = 100;
const PHASE_2_MAX_B = 100;
const PHASE_2_MAX_A = 1;

const PHASE_3_MIN_R = 100;
const PHASE_3_MIN_G = 100;
const PHASE_3_MIN_B = 0;
const PHASE_3_MIN_A = 1;

const PHASE_3_MAX_R = 100;
const PHASE_3_MAX_G = 100;
const PHASE_3_MAX_B = 100;
const PHASE_3_MAX_A = 1;


const reflow = function() {void document.body.offsetWidth;}

const randColor = function() { return Math.floor(155 + (100 * Math.random())); }

const calculateShadeHP = function(override_level) {
	const level = 1 + (override_level ? override_level : shadesCreated);
    var scale = level * SHADE_HP_SCALE;
    return Math.round(SHADE_BASE_HP + Math.pow(level,scale));
}

const calculateShadeDamage = function() {return calculateShadeHP(); }

const calculateClickPower = function() {return 1 + clickUpgradeLevel * CLICK_POWER_INCREASE}

const calculateBlobEnergy = function() {
	return (calculateTrainCost() + calculateSpeedUpgradeCost() + calculateClickUpgradeCost()) / 3 * (Math.random() * BLOB_ENERGY_MULTIPLIER_CONST);
}

const setPetalRadius = function(radius) {
	document.querySelectorAll(".petal").forEach(petalElm => {
		petalElm.style.borderRadius = radius;
	});
}

const setPetalColor = function(color) {
	document.querySelectorAll(".petal").forEach(petalElm => {
		petalElm.style.backgroundColor = color;
	});
	// mainNode.style.backgroundColor = color;
}


const calculateClickDamage = function() {return calculateClickPower()}

const calculateTrainCost = function(override_level) {
	const level = 1 + (override_level ? override_level : document.querySelectorAll(".satellite").length);
    var scale = level * TRAIN_COST_CONST;
    return Math.round(Math.pow(level,scale));
}
const calculateSpeedUpgradeCost = function(override_level) {
	const level = 1 + (override_level ? override_level : speedUpgradeLevel);
    var scale = level * SPEED_COST_CONST;
    return Math.round(Math.pow(level,scale));
}
const calculateClickUpgradeCost = function(override_level) {
	const level = 1 + (override_level ? override_level : clickUpgradeLevel);
    var scale = level * CLICK_COST_CONST;
    return Math.round(Math.pow(level,scale));
}

const createClickParticle = function(x, y) {
	const elm = document.createElement("div");
	elm.classList.add("particle");
	elm.classList.add("new");
	elm.style.top = `${y}px`;
	elm.style.left = `${x}px`;
	document.body.appendChild(elm);
	window.setTimeout(_ => {elm.classList.remove("new")}, 1);
}

const setMusicChannelsVolume = function() {
	const ch = parseInt(Math.floor(energy/PHASE_3_THRESHOLD))
	const chunk = PHASE_3_THRESHOLD/audioElements.length;
	for (var i = 1; i < audioElements.length; i++) {
		var volume = 0;
		const lastEnergyChunk = (i-1)*chunk;
		const chunkPart = energy - lastEnergyChunk;	
		if (energy >= i*chunk) volume = 1;
		else if(energy >= lastEnergyChunk) {
			volume = chunkPart/chunk;
		}
		audioElements[i].volume = volume;
	}
}

const playMusicChannels = function(play) {
	audioElements.forEach(audio => {
		if (play) audio.play()
		else audio.stop()
	});
}

const displayIntroScreen = function() {
	energy = 0;
	document.body.dataset.screen = "intro";
}

const startGame = function() {
	energy = 0;
	shadesCreated = 0;
	clickUpgradeLevel = 0;
	speedUpgradeLevel = 0;
	destroyAllBlobs();
	destroyAllShades();
	playMusicChannels(true);
	document.body.dataset.screen = "game";
	gameStartDate = new Date();
	running = true;
	if (mainNode) mainNode.remove();
	createNode();
}

const displayOutroScreen = function() {
	gameCompleteDate = new Date();
	document.body.dataset.screen = "outro";
	outroElm.querySelector("p").innerText = `You beat the game in ${((gameCompleteDate.getTime() - gameStartDate.getTime()) / 1000).toPrecision(3)} seconds.`;
}

const createBlobOrbit = function() {
	const elm = document.createElement("div");		
	elm.classList.add("blob-orbit");
	var x = Math.random()*100;
	var y = Math.random()*100;
	if (Math.random() > 0.5) x = (x < 50) ? 1 : 99;
	else y = (y < 50) ? 1 : 99;
	elm.style.top = `${y*window.innerHeight/100}px`;
	elm.style.left = `${x*window.innerWidth/100}px`;
	const w = Math.max(30, Math.random()*50);
	const h = Math.max(30, Math.random()*50);
	elm.style.width = `${w*window.innerWidth/100}px`;
	elm.style.height = `${h*window.innerHeight/100}px`;
	elm.style.marginLeft = `${-(w*window.innerWidth/100)/2}px`;
	elm.style.marginTop = `${-(h*window.innerHeight/100)/2}px`;
	if (Math.random() > 0.5) elm.classList.add("reverse");

	const blobElm = document.createElement("div");		
	blobElm.classList.add("blob");
	const bs = Math.max(16, Math.random()*32);
	blobElm.style.width = `${bs}px`;
	blobElm.style.height = `${bs}px`;
	if (Math.random() > 0.5) blobElm.classList.add("reverse");
	elm.appendChild(blobElm);

	gameElm.appendChild(elm);
}

const createShade = function() {
	const elm = document.createElement("div");		
	elm.classList.add("shade-container");

	var x = Math.random()*100;
	var y = Math.random()*100;
	if (Math.random() > 0.5) x = (x < 50) ? 1 : 99;
	else y = (y < 50) ? 1 : 99;
	elm.style.top = `${y*window.innerHeight/100}px`;
	elm.style.left = `${x*window.innerWidth/100}px`;
	elm.dataset.hp = calculateShadeHP();
	const shadeElm = document.createElement("div");		
	shadeElm.classList.add("shade");
	elm.appendChild(shadeElm);
	gameElm.appendChild(elm);
	shadesCreated++;
	window.setTimeout(_ => {elm.classList.add("attack")}, 1000);
}

const destroyAllShades = function() {document.querySelectorAll(".shade-container").forEach(elm => {elm.classList.add("explode")});}
const destroyAllBlobs = function() {document.querySelectorAll(".blob-orbit").forEach(elm => {elm.remove()});}

const createNode = function() {
	const elm = document.createElement("div");
	mainNode = elm;
	elm.classList.add("node");

	for (var i = 0; i < 4; i++) {
		const petalElm = document.createElement("div");
		petalElm.classList.add("petal");
		elm.appendChild(petalElm);
	}

	const budElm = document.createElement("div");		
	budElm.classList.add("bud");
	elm.appendChild(budElm);
	createOrbit(elm);
	gameElm.appendChild(elm);
	mainBud = budElm;
	window.setTimeout(_ => {elm.classList.remove("new")}, 1);
	return elm;
}

const createOrbit = function(parentElm) {
	const siblingCount = parentElm.querySelectorAll(".orbit").length;
	const n = 1 + siblingCount * ORBIT_SCALE;
	const elm = document.createElement("div");
	elm.classList.add("orbit");
	elm.dataset.color = [randColor(),randColor(),randColor()];
	elm.dataset.max = ORBIT_MAX_COUNT_MIN + siblingCount * ORBIT_MAX_COUNT_SCALE;
	elm.style.width = `${ORBIT_ORBIT_SIZE * n}px`;
	elm.style.height = `${ORBIT_ORBIT_SIZE * n}px`;
	elm.style.marginLeft = `${-ORBIT_ORBIT_SIZE * n/2}px`;
	elm.style.marginTop = `${-ORBIT_ORBIT_SIZE * n/2}px`;
	// createSatellite(elm);
	parentElm.appendChild(elm);
	currentOrbit = elm;
	// mainNode.style.transform = `scale(${UNIVERSE_SCALE-siblingCount})`;
	return elm;
}

const createSatellite = function(parentElm) {
	const orbitFactor = mainNode.querySelectorAll(".orbit").length/10;
	const n = 1 + parentElm.querySelectorAll(".satellite").length;
	const elm = document.createElement("div");		
	elm.classList.add("satellite");
	const max = parseInt(parentElm.dataset.max);
	//const c = parentElm.dataset.color.split(",").map(e=>parseInt(e));
	const c = [randColor(),randColor(),randColor()];
	const factor = 1;//(1.5-(n/max));
	const color = `rgb(${c[0]*factor},${c[1]*factor},${c[2]*factor})`;
	const colorA = `rgba(${c[0]},${c[1]},${c[2]},1)`;
	elm.style.borderColor = color;
	elm.style.width = parentElm.style.width;
	elm.style.height = parentElm.style.height;
	elm.style.marginLeft = parentElm.style.marginLeft;
	elm.style.marginTop = parentElm.style.marginTop;
	const speed = SATELLITE_BASE_DURATION + (SATELLITE_BASE_DURATION * n) * orbitFactor * (1-SPEED_UPGRADE*speedUpgradeLevel);
	elm.style.animationDuration = `${speed}s`;
	elm.style.animationIterationCount = 'infinite';
	const satelliteNode = document.createElement("div");
	satelliteNode.classList.add("satellite-node", "new");
	satelliteNode.style.backgroundColor = color;
	satelliteNode.style.boxShadow = `${colorA} 0 0 20px`;
	const w = Math.max(16, Math.random()*32);
	satelliteNode.style.width = `${w}px`;
	satelliteNode.style.marginLeft = `${w/2}px`;
	elm.appendChild(satelliteNode);
	parentElm.appendChild(elm);
	window.setTimeout(_ => {satelliteNode.classList.remove("new")}, 1);
	return elm;
}

const Init = function() {
	document.addEventListener("keyup", onKeyUp);
	document.addEventListener("mousedown", evt => {
		shiftKey = evt.shiftKey;
		altKey = evt.altKey;
		mouseDown = true;
	});
	document.addEventListener("mouseup", evt => {
		shiftKey = false;
		altKey = false;
		mouseDown = false;
	});
	document.addEventListener("mousemove", evt => {
		cursorElm.style.transform = `translate(${evt.clientX}px, ${evt.clientY}px)`;
	})
	document.addEventListener("click", onClick);

	document.addEventListener("animationiteration", evt => {
		if (!running) return;
		if (evt.target.classList.contains("satellite")) {
			energy += ENERGY_PER_CYCLE;
		}
	});

	document.addEventListener("animationend", evt => {
		if (evt.target.classList.contains("blob-orbit")) {
			evt.target.classList.add("disappear");
		}
	});

	document.addEventListener("transitionend", evt => {
		if (!running) return;
		if (evt.target.classList.contains("blob") && evt.target.classList.contains("acquire")) {
			evt.target.parentElement.remove();
		} else if (evt.target.classList.contains("blob-orbit") && evt.target.classList.contains("disappear")) {
			evt.target.remove();
		} else if (evt.target.classList.contains("particle") && !evt.target.classList.contains("new")) {
			evt.target.remove();
		} else if (evt.target.classList.contains("shade-container")) {
			if (evt.target.classList.contains("explode")) {
				evt.target.remove();
			} else {
				energy = Math.max(0, energy - calculateShadeDamage());
				evt.target.classList.add("explode");
			}
		}
	});
	window.requestAnimationFrame(tick);
	window.setTimeout(onBlobSpawnTimerCompete, BLOB_SPAWN_TIMER_MIN + Math.random() * (BLOB_SPAWN_TIMER_MAX - BLOB_SPAWN_TIMER_MIN));
	window.setTimeout(onShadeSpawnTimerCompete, SHADE_SPAWN_TIMER_MIN + Math.random() * (SHADE_SPAWN_TIMER_MAX - SHADE_SPAWN_TIMER_MIN));
	displayIntroScreen();
};

const onBlobSpawnTimerCompete = function() {
	if (!running) return;
	if (document.querySelectorAll("blob-orbit").length < BLOB_MAX_COUNT) {
		createBlobOrbit();
	}
	window.setTimeout(onBlobSpawnTimerCompete, BLOB_SPAWN_TIMER_MIN + Math.random() * (BLOB_SPAWN_TIMER_MAX - BLOB_SPAWN_TIMER_MIN));
}

const onShadeSpawnTimerCompete = function() {
	if (!running) return;
	if (canSpawnShades && document.querySelectorAll("shade-container").length < SHADE_MAX_COUNT) {
		createShade();
	}
	window.setTimeout(onShadeSpawnTimerCompete, SHADE_SPAWN_TIMER_MIN + Math.random() * (SHADE_SPAWN_TIMER_MAX - SHADE_SPAWN_TIMER_MIN));
}

const onKeyUp = function(evt) {
	const key = evt.key.toLowerCase();
	if (evt.key == "f") trainButtonElm.click();
	else if (evt.key == "s") upgradeSpeedButtonElm.click();
	else if (evt.key == "c") upgradeClickButtonElm.click();
}

const onClick = function(evt) {
	if (document.body.dataset.screen == "intro") startGame();
	else if (document.body.dataset.screen == "outro") displayIntroScreen();

	if (!running) return;
	// if (evt.shiftKey) createBlobOrbit();
	// if (evt.altKey) createShade();
	if (evt.target.classList.contains("blob") && !evt.target.classList.contains("acquire")) {
		energy += calculateBlobEnergy();
		evt.target.classList.add("acquire");
	} else if (evt.target.id == "train") {
		const cost = calculateTrainCost();
		if (energy < cost) return;
		energy -= cost;
		if (currentOrbit.childElementCount >= currentOrbit.dataset.max) {
			createOrbit(mainNode);
			createSatellite(currentOrbit);
		} else {
			createSatellite(currentOrbit);
		}
		trainButtonElm.title = calculateTrainCost();
	} else if (evt.target == upgradeSpeedButtonElm) {
		const cost = calculateSpeedUpgradeCost();
		if (energy < cost) return;
		speedUpgradeLevel++;
		energy -= cost;
		document.querySelectorAll(".satellite").forEach(satellite => {
			const speed = parseFloat(satellite.style.animationDuration)*(1-SPEED_UPGRADE*speedUpgradeLevel);
			satellite.style.animationDuration = `${speed}s`;
		});
		upgradeSpeedButtonBarElm.title = calculateSpeedUpgradeCost();
	} else if (evt.target == upgradeClickButtonElm) {
		const cost = calculateClickUpgradeCost();
		if (energy < cost) return;
		clickUpgradeLevel++;
		energy -= cost;
		upgradeClickButtonBarElm.title = calculateSpeedUpgradeCost();
	} else if (evt.target.classList.contains("shade")) {
		const shadeContainer = evt.target.parentElement;
		shadeContainer.dataset.hp = Math.max(0, parseFloat(shadeContainer.dataset.hp) - calculateClickDamage());
		if (parseFloat(shadeContainer.dataset.hp) <= 0) {
			evt.target.parentElement.classList.add("explode");
		}
	} else {
		createClickParticle(evt.clientX, evt.clientY);
		energy += calculateClickPower();
	}
}

const tick = function() {
	setMusicChannelsVolume();
	if (running) {
		// if (energy != displayedEnergy && energy > 0) {
		// 	if (energy > displayedEnergy) displayedEnergy++;
		// 	if (energy < displayedEnergy) displayedEnergy--;
		// 	// progressElm.innerText = `${displayedEnergy}`;
		// }

	
		const trainCost = calculateTrainCost();
		const speedUpgradeCost = calculateSpeedUpgradeCost();
		const clickUpgradeCost = calculateClickUpgradeCost();
		
		trainButtonElm.classList.toggle("enabled", energy >= trainCost);
		upgradeSpeedButtonElm.classList.toggle("enabled", energy >= speedUpgradeCost);
		upgradeClickButtonElm.classList.toggle("enabled", energy >= clickUpgradeCost);
		trainButtonBarElm.style.width = `${Math.min(1, energy/trainCost)*100}%`;
		upgradeSpeedButtonBarElm.style.width = `${Math.min(1, energy/speedUpgradeCost)*100}%`;
		upgradeClickButtonBarElm.style.width = `${Math.min(1, energy/clickUpgradeCost)*100}%`;
	
	
		if (energy < PHASE_1_THRESHOLD) {
			// Phase 1, awakening
			//document.title = "PHASE1: " + energy;
			document.body.className = "phase1"
			canSpawnShades = false;
			const bgFade = 0.5;
			const phaseProgress = energy/PHASE_1_THRESHOLD;
			const r = PHASE_1_MIN_R + Math.max(PHASE_1_MIN_R, phaseProgress * (PHASE_1_MAX_R - PHASE_1_MIN_R));
			const g = PHASE_1_MIN_G + Math.max(PHASE_1_MIN_G, phaseProgress * (PHASE_1_MAX_G - PHASE_1_MIN_G));
			const b = PHASE_1_MIN_B + Math.max(PHASE_1_MIN_B, phaseProgress * (PHASE_1_MAX_B - PHASE_1_MIN_B));
			const a = PHASE_1_MIN_A + Math.max(PHASE_1_MIN_A, phaseProgress * (PHASE_1_MAX_A - PHASE_1_MIN_A));
			setPetalColor(`rgba(${r},${g},${b},${a})`);
			// console.log(`radial-gradient(rgb(${rg}, ${rg}, ${b}), rgb(0,0,0));`);
			document.body.style.background = `radial-gradient(rgb(${r*bgFade}, ${g*bgFade}, ${b*bgFade}), rgb(0,0,0))`;
			//document.body.style.background = `radial-gradient(rgb(${rg}, ${rg}, ${b}), rgb(0,0,0));`;
			setPetalRadius(`50% 50% 50% 50% / 50% 50% 50% 50%`);
			const progressText = `${Math.round(phaseProgress*100)}%`;
			if (progressElm.innerText != progressText) progressElm.innerText = progressText;
		} else if (energy >= PHASE_1_THRESHOLD && energy < PHASE_1_THRESHOLD+PHASE_2_THRESHOLD) {
			// Phase 2, dancing
			//document.title = "PHASE2: " + energy;
			document.body.className = "phase2";
			canSpawnShades = true;
			const phaseProgress = (energy-PHASE_1_THRESHOLD)/PHASE_2_THRESHOLD;
			const r = PHASE_2_MIN_R + Math.max(PHASE_2_MIN_R, phaseProgress * (PHASE_2_MAX_R - PHASE_2_MIN_R));
			const g = PHASE_2_MIN_G + Math.max(PHASE_2_MIN_G, phaseProgress * (PHASE_2_MAX_G - PHASE_2_MIN_G));
			const b = PHASE_2_MIN_B + Math.max(PHASE_2_MIN_B, phaseProgress * (PHASE_2_MAX_B - PHASE_2_MIN_B));
			const a = PHASE_2_MIN_A + Math.max(PHASE_2_MIN_A, phaseProgress * (PHASE_2_MAX_A - PHASE_2_MIN_A));
			const radius = Math.max(5, (50-50*phaseProgress));
			setPetalColor(`rgba(${r},${g},${b},${a})`);
			// mainNode.style.borderTopLeftRadius = `${radius}% ${radius}%`;
			document.querySelectorAll(".satellite-node.collecting").forEach(satelliteNode => {
				satelliteNode.classList.remove("collecting");
				satelliteNode.style.transform = ``;
			});
			setPetalRadius(`${radius}% ${100-radius}% 50% 50% / ${radius}% 50% 50% ${100-radius}%`);
			const progressText = `${Math.round(phaseProgress*100)}%`
			if (progressElm.innerText != progressText) progressElm.innerText = progressText;
	
		} else if (energy >= PHASE_1_THRESHOLD+PHASE_2_THRESHOLD && energy < PHASE_1_THRESHOLD+PHASE_2_THRESHOLD+PHASE_3_THRESHOLD) {
			// Phase 3, Harvesting
			//document.title = "PHASE3: " + energy;
			document.body.className = "phase3"
			canSpawnShades = true;
			const phaseProgress = (energy-PHASE_2_THRESHOLD-PHASE_1_THRESHOLD)/PHASE_3_THRESHOLD;
			const r = PHASE_3_MIN_R + Math.max(PHASE_3_MIN_R, phaseProgress * (PHASE_3_MAX_R - PHASE_3_MIN_R));
			const g = PHASE_3_MIN_G + Math.max(PHASE_3_MIN_G, phaseProgress * (PHASE_3_MAX_G - PHASE_3_MIN_G));
			const b = PHASE_3_MIN_B + Math.max(PHASE_3_MIN_B, phaseProgress * (PHASE_3_MAX_B - PHASE_3_MIN_B));
			const a = PHASE_3_MIN_A + Math.max(PHASE_3_MIN_A, phaseProgress * (PHASE_3_MAX_A - PHASE_3_MIN_A));
	
			setPetalColor(`rgba(${PHASE_2_MAX_R},${PHASE_2_MAX_G},${PHASE_2_MAX_B},${PHASE_2_MAX_A})`);

			setPetalRadius(`5% 95% 50% 50% / 5% 50% 50% 95%`);
			mainBud.style.backgroundColor = `rgba(${r},${g},${b},${a})`;
			document.querySelectorAll(".satellite-node").forEach(satelliteNode => {
				satelliteNode.classList.add("collecting");
				satelliteNode.style.transform = `translate(0, ${parseFloat(satelliteNode.parentElement.style.width)/4}px) scale(0.5)`;
			});
			const progressText = `${Math.round(phaseProgress*100)}%`
			if (progressElm.innerText != progressText) progressElm.innerText = progressText;
	
		} else if (energy >= PHASE_1_THRESHOLD+PHASE_2_THRESHOLD+PHASE_3_THRESHOLD) {
			// Phase 4, Victory
			running = false;
			canSpawnShades = false;
			destroyAllShades();
			setPetalRadius(`5% 95% 50% 50% / 5% 50% 50% 95%`);
			//document.title = "PHASE4: " + energy;
			document.body.className = "phase4"
			document.querySelectorAll(".satellite-node").forEach(satelliteNode => {
				satelliteNode.classList.remove("collecting");
				satelliteNode.classList.add("leaving");
				const leavingTime = Math.max(LEAVING_TIME_MIN, Math.random()*LEAVING_TIME_MAX);
				satelliteNode.style.transition = `transform ${leavingTime}s, opacity ${leavingTime}s`;
				satelliteNode.style.transform = ``;
			});
			window.setTimeout(displayOutroScreen, 5000);
		}
	}
	window.requestAnimationFrame(tick);
};
Init();