
var running = true;
var energy = 0;
var displayedEnergy = -1;
var mainNode;
var currentOrbit;
const ENERGY_PER_CYCLE = 1;
const trainButtonLabelElm = document.querySelector("#train span");
const upgradeButtonLabelElm = document.querySelector("#upgrade span");
const BASE_ORBIT_SIZE = 256;
const BASE_ANIMATION_SPEED = 1.5;
const ORBIT_SCALE = 0.1;
const ORBIT_MAX_COUNT_MIN = 5;
const ORBIT_MAX_COUNT_SCALE = 2;
const UNIVERSE_SCALE = 3;
const LEAVING_TIME_MIN = 15;
const LEAVING_TIME_MAX = 25;
const TRAIN_COST = 5;
const SPEED_COST = 5;
const SPEED_UPGRADE = 0.005;
var speedUpgradeLevel = 1;
var mouseDown = false;
var mouseClick = false;
var shiftKey = false;
var altKey = false;

const PHASE_1_THRESHOLD = 100;
const PHASE_2_THRESHOLD = 500;
const PHASE_3_THRESHOLD = 1000;
const PHASE_4_THRESHOLD = 4000;

const reflow = _ => {void document.body.offsetWidth;}

const randColor = _ => { return Math.floor(155 + (100 * Math.random())); }

const createNode = function() {
	const elm = document.createElement("div");
	mainNode = elm;
	elm.classList = "node";
	createOrbit(elm);
	document.body.appendChild(elm);
	return elm;
}

const createOrbit = function(parentElm) {
	const siblingCount = parentElm.querySelectorAll(".orbit").length;
	const n = 1 + siblingCount * ORBIT_SCALE;
	const elm = document.createElement("div");
	elm.classList = "orbit";
	elm.dataset.color = [randColor(),randColor(),randColor()];
	elm.dataset.max = ORBIT_MAX_COUNT_MIN + siblingCount * ORBIT_MAX_COUNT_SCALE;
	elm.style.width = `${BASE_ORBIT_SIZE * n}px`;
	elm.style.height = `${BASE_ORBIT_SIZE * n}px`;
	elm.style.marginLeft = `${-BASE_ORBIT_SIZE * n/2}px`;
	elm.style.marginTop = `${-BASE_ORBIT_SIZE * n/2}px`;
	createSatellite(elm);
	parentElm.appendChild(elm);
	currentOrbit = elm;
	// mainNode.style.transform = `scale(${UNIVERSE_SCALE-siblingCount})`;
	return elm;
}

const createSatellite = function(parentElm) {
	const orbitFactor = mainNode.querySelectorAll(".orbit").length/10;
	const n = 1 + parentElm.querySelectorAll(".satellite").length;
	const elm = document.createElement("div");		
	elm.classList = "satellite";
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
	const speed = BASE_ANIMATION_SPEED + (BASE_ANIMATION_SPEED * n) * orbitFactor * (1-SPEED_UPGRADE*speedUpgradeLevel);
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
	createNode();
	trainButtonLabelElm.innerText = calculateTrainCost();
	upgradeButtonLabelElm.innerText = calculateUpgradeCost();
	document.addEventListener("mousedown", evt => {
		shiftKey = evt.shiftKey;
		altKey = evt.altKey;
		mouseDown = true;
	})
	document.addEventListener("mouseup", evt => {
		shiftKey = false;
		altKey = false;
		mouseDown = false;
	})
	document.addEventListener("click", onClick);

	document.addEventListener("animationiteration", evt => {
		if (!running) return;
		const elm = evt.target;
		if (elm.classList.contains("satellite")) {
			energy += ENERGY_PER_CYCLE;
			const satelliteNode = elm.children[0];

			// const speed = parseFloat(elm.style.animationDuration)*0.9999;
			// elm.style.animationDuration = `${speed}s`;
		}
	});
	window.requestAnimationFrame(tick);
};

const calculateTrainCost = function() {
	return document.querySelectorAll(".satellite").length * TRAIN_COST;;
}

const calculateUpgradeCost = function() {
	return speedUpgradeLevel * SPEED_COST;
}

const onClick = function(evt) {
	if (evt.target.id == "train") {
		const cost = calculateTrainCost();
		if (energy < cost) return;
		energy -= cost;
		if (currentOrbit.childElementCount >= currentOrbit.dataset.max) {
			createOrbit(mainNode)
		} else {
			createSatellite(currentOrbit);
		}
		trainButtonLabelElm.innerText = calculateTrainCost();
	} else if (evt.target.id == "upgrade") {
		const cost = calculateUpgradeCost();
		if (energy < cost) return;
		speedUpgradeLevel++;
		energy -= cost;
		document.querySelectorAll(".satellite").forEach(satellite => {
			const speed = parseFloat(satellite.style.animationDuration)*(1-SPEED_UPGRADE*speedUpgradeLevel);
			satellite.style.animationDuration = `${speed}s`;
		});
		upgradeButtonLabelElm.innerText = calculateUpgradeCost();
	}
}

const tick = function() {
	
	if (energy != displayedEnergy && energy > 0) {
		if (energy > displayedEnergy) displayedEnergy++;
		if (energy < displayedEnergy) displayedEnergy--;
		mainNode.dataset.energy = `${displayedEnergy}`;
	}

	if (!running) return;

	// Phase 1, awakening
	if (energy < PHASE_1_THRESHOLD) {
		document.title = "PHASE1";
		const rg = Math.max(5, (energy/PHASE_1_THRESHOLD)*25);
		const b = Math.max(25, (energy/PHASE_1_THRESHOLD)*100);
		// const a = Math.max(0.1, energy/PHASE_1_THRESHOLD);
		const a = 1;
		mainNode.style.backgroundColor = `rgba(${rg},${rg},${b},${a})`;
	}
	
	// Phase 2, dancing
	if (energy > PHASE_1_THRESHOLD && energy < PHASE_2_THRESHOLD) {
		document.title = "PHASE2";
		const radius = (50-energy/10);
		// mainNode.style.borderTopLeftRadius = `${radius}% ${radius}%`;
		mainNode.style.borderRadius = `${radius}% ${100-radius}% 50% 50% / ${radius}% 50% 50% ${100-radius}%`;
		if(radius <= 5) {
			document.querySelectorAll(".satellite-node").forEach(satelliteNode => {
				satelliteNode.classList.add("collecting");
				satelliteNode.style.transform = `translate(0, ${parseFloat(satelliteNode.parentElement.style.width)/4}px) scale(0.5)`;
			});
		}
	}

	if (energy > PHASE_3_THRESHOLD) {
		document.title = "PHASE3"
		running = false;
		document.querySelectorAll(".satellite-node").forEach(satelliteNode => {
			satelliteNode.classList.remove("collecting");
			satelliteNode.classList.add("leaving");
			const leavingTime = Math.max(LEAVING_TIME_MIN, Math.random()*LEAVING_TIME_MAX);
			satelliteNode.style.transition = `transform ${leavingTime}s, opacity ${leavingTime}s`;
			satelliteNode.style.transform = ``;
			
		});
	}

	window.requestAnimationFrame(tick);
};
Init();