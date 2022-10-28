<script setup lang="ts">
import gsap from 'gsap';
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import useStore from '../store';
import colors from '../assets/colors.json';

const store = useStore();
const angle = computed(() => 360 / store.wheel.values.length);
const emit = defineEmits<{
    (e: 'result', res: number | null): void
}>()
var tl = gsap.timeline();
var running = false;
var randPending = false;
var randoms: number[] = [];
const wheelCanvas = ref<HTMLCanvasElement>();
const canvasSize = 1000;
const inst = getCurrentInstance();

async function getRandoms() {
    randPending = true;
    return fetch(`https://www.random.org/integers/?num=1000&min=${store.settings.wheel.spinMin}&max=${store.settings.wheel.spinMax}&col=1&base=10&format=plain&rnd=new`).then(res => {
        randPending = false;
        return res.text()
    }).then(res => {
        randoms.push(...(res.split('\n').map(res => parseInt(res))));
    }).catch(err => { })
}
if (import.meta.env.PROD && store.settings.wheel.useRandomOrg)
    getRandoms();

onMounted(() => {
    tl.pause(0);
    tl.fromTo(wheelCanvas.value as HTMLCanvasElement, {
        rotation: 0,
        transformOrigin: '50% 50%'
    }, {
        rotation: 360,
        duration: 1,
        repeat: 10,
        ease: 'none'
    });
});

function spin() {
    if (running)
        return;
    tl.restart();
    running = true;
    const time = getRandomTime();
    console.log(time);
    setTimeout(() => {
        tl.pause();
        const val = Math.floor(((90 + parseFloat((wheelCanvas.value?.style?.transform?.match(/rotate\((\d+(\.{1}\d+)?)deg\)/) || [0, '0'])[1].toString())) % 360) / angle.value);
        const res = store.wheel.values[store.wheel.values.length - 1 - val];
        running = false;
        emit('result', res === null ? null : tryParse(res, 0));
    }, time);
}

function tryParse(x: string | number, def: number | null = null) {
    if (typeof x === 'string') {
        const res = parseInt(x);
        if (isNaN(res))
            return def;
        return res;
    }
    return x;
}

function getRandomTime() {
    if (randoms.length < 50 && !randPending && import.meta.env.PROD && store.settings.wheel.useRandomOrg) {
        getRandoms();
    }
    return randoms.pop() ?? getRandomInt(store.settings.wheel.spinMin, store.settings.wheel.spinMax);;
}

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function drawWheel() {
    if (!wheelCanvas.value || !store.wheel.values.length)
        return;
    const ctx = wheelCanvas.value.getContext('2d');
    if (!ctx)
        return;

    ctx.clearRect(0, 0, wheelCanvas.value.width, wheelCanvas.value.height);

    let currentAngle = 0;
    let portionAngle = (1 / store.wheel.values.length) * 2 * Math.PI;

    ctx.font = "bold 50px Arial";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = '#000';
    ctx.textAlign = "right";

    const center = canvasSize / 2;
    var color = getColors();
    ctx.lineWidth = 5;

    for (let val of store.wheel.values) {
        ctx.beginPath();
        ctx.arc(center, center, center - 40, currentAngle, currentAngle + portionAngle);
        currentAngle += portionAngle;
        ctx.lineTo(center, center);
        if (color.length === 0)
            color = getColors();
        ctx.fillStyle = val === null ? '#000' : ('#' + (color.pop() ?? 'fff'));
        ctx.fill();
        ctx.stroke();
    }
    ctx.translate(center, center);
    ctx.rotate(-(portionAngle / 2));
    ctx.translate(-center, -center);
    for (let val of store.wheel.values) {
        ctx.translate(center, center);
        ctx.rotate(portionAngle);
        ctx.translate(-center, -center);
        ctx.fillStyle = '#fff';
        ctx.fillText(val === null ? "BANKRUT" : val.toString(), (center * 2) - 60, center, center / 2);
    }
    ctx.resetTransform();

    function getColors(): string[] {
        var cols = [...colors, ...colors, ...colors];
        cols.sort(() => Math.random() - 0.5);
        return cols;
    }
}

onMounted(() => {
    drawWheel();
});

watch(store.wheel.values, () => {
    drawWheel();
}, { deep: true });

if (store.settings.controlled) { //@ts-ignore
    window['wof_spin'] = spin //@ts-ignore
    window['wof_draw'] = drawWheel //@ts-ignore
    window['wof_update_wheel'] = inst?.proxy?.$forceUpdate
}
</script>

<template>
    <div id="wheel" @click="spin">
        <canvas ref="wheelCanvas" width="1000" height="1000"></canvas>
    </div>
</template>

<style lang="scss">
#wheel {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    position: relative;
    overflow: hidden;

    $svg-height: 60vh;
    $arrow-size: 50px;

    canvas {
        width: $svg-height;
        height: $svg-height;
    }

    &::before {
        content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 24 24'%3E%3Cpath d='M8.71 11.71l2.59 2.59c.39.39 1.02.39 1.41 0l2.59-2.59c.63-.63.18-1.71-.71-1.71H9.41c-.89 0-1.33 1.08-.7 1.71z' fill='currentColor'%3E%3C/path%3E%3C/svg%3E");
        position: absolute;
        top: calc(50% - #{calc($svg-height / 2)} - #{calc($arrow-size / 2)});
        left: calc(50% - #{calc($arrow-size / 2)});
        width: $arrow-size;
        height: $arrow-size;
    }
}
</style>