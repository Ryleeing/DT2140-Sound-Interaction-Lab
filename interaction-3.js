//==========================================================================================
// AUDIO SETUP
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit just where you're asked to!
//------------------------------------------------------------------------------------------
//
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

// Change here to ("tuono") depending on your wasm file name
const dspName = "bubble";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// The name should be the same as the WASM file, so change tuono with brass if you use brass.wasm
bubble.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // const exampleMinMaxParam = findByAddress(dspNodeParams, "/thunder/rumble");
        // // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
        // const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
        // console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    });


//==========================================================================================
// INTERACTIONS
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit the next functions to create interactions
// Decide which parameters you're using and then use playAudio to play the Audio
//------------------------------------------------------------------------------------------
//
//==========================================================================================

// Free-fall detection: fall distance d = 0.5 * g * t^2  ->  30 cm needs t ≈ 0.247 s
const FREE_FALL_THRESHOLD = 3.0;   // m/s^2, |a| below this = falling (normal ≈ 9.81)
const FALL_DISTANCE = 0.30;        // metres
const FALL_TIME_MS = Math.sqrt(2 * FALL_DISTANCE / 9.81) * 1000; // ≈ 247 ms
let fallStart = null;
let fallTriggered = false;

function accelerationChange(accx, accy, accz) {
    const mag = Math.sqrt(accx * accx + accy * accy + accz * accz);

    if (mag < FREE_FALL_THRESHOLD) {
        if (fallStart === null) fallStart = millis();
        if (!fallTriggered && millis() - fallStart >= FALL_TIME_MS) {
            fallTriggered = true;   // play only once per fall
            playAudio();
            console.log("Free fall detected!");
        }
    } else {
        // landed / caught: reset for the next drop
        fallStart = null;
        fallTriggered = false;
    }
}

// ---- TEST: simulate a free fall (button + press "f" on keyboard) ----
function simulateFall() {
    if (audioContext.state === 'suspended') audioContext.resume();
    const start = Date.now();
    const id = setInterval(() => {
        if (Date.now() - start < 400) {
            accelerationChange(0.2, 0.1, 0.3);   // ~weightless, like falling
        } else {
            accelerationChange(0, 0, 9.81);      // "landed" -> resets detector
            clearInterval(id);
        }
    }, 16);
}

window.addEventListener('load', () => {
    const btn = document.createElement('button');
    btn.textContent = 'Simulate fall';
    btn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:1000;padding:12px;font-size:16px;';
    btn.addEventListener('click', (e) => { e.stopPropagation(); simulateFall(); });
    document.body.appendChild(btn);
});

function keyPressed() {
    if (key === 'f') simulateFall();
}

function rotationChange(rotx, roty, rotz) {
}

function mousePressed() {
    playAudio(mouseX/windowWidth)
    // Use this for debugging from the desktop!
}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}
function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
    playAudio();
}

function getMinMaxParam(address) {
    const exampleMinMaxParam = findByAddress(dspNodeParams, address);
    // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
    const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
    console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    return [exampleMinValue, exampleMaxValue]
}

//==========================================================================================
// AUDIO INTERACTION
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit here to define your audio controls 
//------------------------------------------------------------------------------------------
//
//==========================================================================================

function playAudio(pressure) {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    console.log(pressure)
    setTimeout(() => { dspNode.setParamValue("/bubble/Freeverb/0x00/Damp", 0.8)
// dspNode.setParamValue("/bubble/Freeverb/0x00/Damp", 0.8)
dspNode.setParamValue("/bubble/Freeverb/0x00/RoomSize", 0.72)
dspNode.setParamValue("/bubble/bubble/freq", 332)
 }, 100);
}

//==========================================================================================
// END
//==========================================================================================