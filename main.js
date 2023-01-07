
var running = true;
var energy = 0;
var displayedEnergy = -1;
var mainNode;
var mainBud;
var currentOrbit;
const ENERGY_PER_CYCLE = 1;
const trainButtonElm = document.querySelector("#train");
const upgradeButtonElm = document.querySelector("#upgrade");
const trainButtonLabelElm = document.querySelector("#train span");
const upgradeButtonLabelElm = document.querySelector("#upgrade span");
const cursorElm = document.querySelector("#cursor");
const progressElm = document.querySelector("#progress");
const BASE_ORBIT_SIZE = 256;
const BASE_ANIMATION_SPEED = 1.5;
const ORBIT_SCALE = 0.7;
const ORBIT_MAX_COUNT_MIN = 25;
const ORBIT_MAX_COUNT_SCALE = 1;
const UNIVERSE_SCALE = 3;
const LEAVING_TIME_MIN = 15;
const LEAVING_TIME_MAX = 25;
const TRAIN_COST = 1;
const SPEED_COST = 2;
const SPEED_UPGRADE = 0.005;
const BLOB_ENERGY_BASE = 22;
const BLOB_SPAWN_TIMER_MIN = 5000;
const BLOB_SPAWN_TIMER_MAX = 30000;
const BLOB_MAX_COUNT = 5;
var speedUpgradeLevel = 1;
var mouseDown = false;
var mouseClick = false;
var shiftKey = false;
var altKey = false;

const PHASE_1_THRESHOLD = 200;
const PHASE_2_THRESHOLD = 1000;
const PHASE_3_THRESHOLD = 3000;
const PHASE_4_THRESHOLD = 4000;

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


const reflow = _ => {void document.body.offsetWidth;}

const randColor = _ => { return Math.floor(155 + (100 * Math.random())); }

const createNode = function() {
	const elm = document.createElement("div");
	mainNode = elm;
	elm.classList = "node";
	const budElm = document.createElement("div");		
	budElm.classList.add("bud");
	elm.appendChild(budElm);
	createOrbit(elm);
	document.body.appendChild(elm);
	mainBud = budElm;
	return elm;
}

const createBlobOrbit = function() {
	const elm = document.createElement("div");		
	elm.classList = "blob-orbit";
	var x = Math.random()*100;
	var y = Math.random()*100;
	if (Math.random() > 0.5) x = (x < 50) ? 1 : 99;
	else y = (y < 50) ? 1 : 99;
	elm.style.top = `${y}vh`;
	elm.style.left = `${x}vw`;
	const w = Math.max(30, Math.random()*50);
	const h = Math.max(30, Math.random()*50);
	elm.style.width = `${w}vw`;
	elm.style.height = `${h}vh`;
	elm.style.marginTop = `${-h/2}vh`;
	elm.style.marginLeft = `${-w/2}vw`;
	if (Math.random() > 0.5) elm.classList.add("reverse");

	const blobElm = document.createElement("div");		
	blobElm.classList.add("blob");
	if (Math.random() > 0.5) blobElm.classList.add("reverse");
	elm.appendChild(blobElm);

	document.body.appendChild(elm);
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
	trainButtonElm.title = calculateTrainCost();
	upgradeButtonElm.title = calculateUpgradeCost();
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
		// cursorElm.style.transform = `translate(${evt.clientX}px, ${evt.clientY}px)`;
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
		}
	});
	window.requestAnimationFrame(tick);
	window.setTimeout(onBlobSpawnTimerCompete, BLOB_SPAWN_TIMER_MIN + Math.random() * (BLOB_SPAWN_TIMER_MAX - BLOB_SPAWN_TIMER_MIN));
};

const onBlobSpawnTimerCompete = function() {
	if (document.querySelectorAll("blob-orbit").length < BLOB_MAX_COUNT) {
		createBlobOrbit();
	}
	window.setTimeout(onBlobSpawnTimerCompete, BLOB_SPAWN_TIMER_MIN + Math.random() * (BLOB_SPAWN_TIMER_MAX - BLOB_SPAWN_TIMER_MIN));
}

const calculateTrainCost = function() {
	return document.querySelectorAll(".satellite").length * TRAIN_COST;;
}

const calculateUpgradeCost = function() {
	return speedUpgradeLevel * SPEED_COST;
}

const onClick = function(evt) {
	if (evt.shiftKey) createBlobOrbit();
	if (evt.target.classList.contains("blob") && !evt.target.classList.contains("acquire")) {
		energy += BLOB_ENERGY_BASE;
		evt.target.classList.add("acquire");
	} else if (evt.target.id == "train") {
		const cost = calculateTrainCost();
		if (energy < cost) return;
		energy -= cost;
		if (currentOrbit.childElementCount >= currentOrbit.dataset.max) {
			createOrbit(mainNode)
		} else {
			createSatellite(currentOrbit);
		}
		trainButtonElm.title = calculateTrainCost();
	} else if (evt.target.id == "upgrade") {
		const cost = calculateUpgradeCost();
		if (energy < cost) return;
		speedUpgradeLevel++;
		energy -= cost;
		document.querySelectorAll(".satellite").forEach(satellite => {
			const speed = parseFloat(satellite.style.animationDuration)*(1-SPEED_UPGRADE*speedUpgradeLevel);
			satellite.style.animationDuration = `${speed}s`;
		});
		upgradeButtonLabelElm.title = calculateUpgradeCost();
	}
}

const tick = function() {
	
	if (energy != displayedEnergy && energy > 0) {
		if (energy > displayedEnergy) displayedEnergy++;
		if (energy < displayedEnergy) displayedEnergy--;
		// progressElm.innerText = `${displayedEnergy}`;
	}

	const trainCost = calculateTrainCost();
	const upgradeCost = calculateUpgradeCost();
	
	trainButtonElm.classList.toggle("enabled", energy >= trainCost);
	upgradeButtonElm.classList.toggle("enabled", energy >= upgradeCost);
	trainButtonLabelElm.style.width = `${Math.min(1, energy/trainCost)*100}%`;
	upgradeButtonLabelElm.style.width = `${Math.min(1, energy/upgradeCost)*100}%`;

	if (!running) return;




	if (energy < PHASE_1_THRESHOLD) {
		// Phase 1, awakening
		document.title = "PHASE1";
		document.body.className = "phase1"
		const bgFade = 0.5;
		const phaseProgress = energy/PHASE_1_THRESHOLD;
		const r = PHASE_1_MIN_R + Math.max(PHASE_1_MIN_R, phaseProgress * (PHASE_1_MAX_R - PHASE_1_MIN_R));
		const g = PHASE_1_MIN_G + Math.max(PHASE_1_MIN_G, phaseProgress * (PHASE_1_MAX_G - PHASE_1_MIN_G));
		const b = PHASE_1_MIN_B + Math.max(PHASE_1_MIN_B, phaseProgress * (PHASE_1_MAX_B - PHASE_1_MIN_B));
		const a = PHASE_1_MIN_A + Math.max(PHASE_1_MIN_A, phaseProgress * (PHASE_1_MAX_A - PHASE_1_MIN_A));
		mainNode.style.backgroundColor = `rgba(${r},${g},${b},${a})`;
		// console.log(`radial-gradient(rgb(${rg}, ${rg}, ${b}), rgb(0,0,0));`);
		document.body.style.background = `radial-gradient(rgb(${r*bgFade}, ${g*bgFade}, ${b*bgFade}), rgb(0,0,0))`;
		//document.body.style.background = `radial-gradient(rgb(${rg}, ${rg}, ${b}), rgb(0,0,0));`;
		const progressText = `${Math.round(phaseProgress*100)}%`;
		if (progressElm.innerText != progressText) progressElm.innerText = progressText;

	} else if (energy > PHASE_1_THRESHOLD && energy < PHASE_1_THRESHOLD+PHASE_2_THRESHOLD) {
		// Phase 2, dancing
		document.title = "PHASE2";
		document.body.className = "phase2";
		const phaseProgress = (energy-PHASE_1_THRESHOLD)/PHASE_2_THRESHOLD;
		const r = PHASE_2_MIN_R + Math.max(PHASE_2_MIN_R, phaseProgress * (PHASE_2_MAX_R - PHASE_2_MIN_R));
		const g = PHASE_2_MIN_G + Math.max(PHASE_2_MIN_G, phaseProgress * (PHASE_2_MAX_G - PHASE_2_MIN_G));
		const b = PHASE_2_MIN_B + Math.max(PHASE_2_MIN_B, phaseProgress * (PHASE_2_MAX_B - PHASE_2_MIN_B));
		const a = PHASE_2_MIN_A + Math.max(PHASE_2_MIN_A, phaseProgress * (PHASE_2_MAX_A - PHASE_2_MIN_A));
		const radius = Math.max(5, (50-50*phaseProgress));
		mainNode.style.backgroundColor = `rgba(${r},${g},${b},${a})`;
		// mainNode.style.borderTopLeftRadius = `${radius}% ${radius}%`;
		document.querySelectorAll(".satellite-node.collecting").forEach(satelliteNode => {
			satelliteNode.classList.remove("collecting");
			satelliteNode.style.transform = ``;
		});
		mainNode.style.borderRadius = `${radius}% ${100-radius}% 50% 50% / ${radius}% 50% 50% ${100-radius}%`;
		const progressText = `${Math.round(phaseProgress*100)}%`
		if (progressElm.innerText != progressText) progressElm.innerText = progressText;

	} else if (energy > PHASE_1_THRESHOLD+PHASE_2_THRESHOLD && energy < PHASE_1_THRESHOLD+PHASE_2_THRESHOLD+PHASE_3_THRESHOLD) {
		// Phase 3, Harvesting
		document.title = "PHASE3"
		document.body.className = "phase3"
		const phaseProgress = (energy-PHASE_2_THRESHOLD-PHASE_1_THRESHOLD)/PHASE_3_THRESHOLD;
		const r = PHASE_3_MIN_R + Math.max(PHASE_3_MIN_R, phaseProgress * (PHASE_3_MAX_R - PHASE_3_MIN_R));
		const g = PHASE_3_MIN_G + Math.max(PHASE_3_MIN_G, phaseProgress * (PHASE_3_MAX_G - PHASE_3_MIN_G));
		const b = PHASE_3_MIN_B + Math.max(PHASE_3_MIN_B, phaseProgress * (PHASE_3_MAX_B - PHASE_3_MIN_B));
		const a = PHASE_3_MIN_A + Math.max(PHASE_3_MIN_A, phaseProgress * (PHASE_3_MAX_A - PHASE_3_MIN_A));

		mainNode.style.backgroundColor = `rgba(${PHASE_2_MAX_R},${PHASE_2_MAX_G},${PHASE_2_MAX_B},${PHASE_2_MAX_A})`;
		mainNode.style.borderRadius = `${5}% ${100-5}% 50% 50% / ${5}% 50% 50% ${100-5}%`;


		mainBud.style.backgroundColor = `rgba(${r},${g},${b},${a})`;
		document.querySelectorAll(".satellite-node").forEach(satelliteNode => {
			satelliteNode.classList.add("collecting");
			satelliteNode.style.transform = `translate(0, ${parseFloat(satelliteNode.parentElement.style.width)/4}px) scale(0.5)`;
		});
		const progressText = `${Math.round(phaseProgress*100)}%`
		if (progressElm.innerText != progressText) progressElm.innerText = progressText;

	} else if (energy > PHASE_1_THRESHOLD+PHASE_2_THRESHOLD+PHASE_3_THRESHOLD) {
		// Phase 4, Victory
		document.title = "PHASE4"
		document.body.className = "phase4"
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