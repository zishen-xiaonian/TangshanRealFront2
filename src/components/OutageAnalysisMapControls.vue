<script setup>
import { ref, watch } from 'vue'

const emit = defineEmits(['change'])

const eventOptions = ref([
  { key: 'overThousand', label: '超千户', icon: 'users', color: '#ff4050', checked: false },
  { key: 'coalToElectricity', label: '煤改电', icon: 'electricity', color: '#12c7a1', checked: false },
  { key: 'importantUser', label: '重要用户', icon: 'important', color: '#f1a51d', checked: false },
])

const warningOptions = ref([
  { key: 'extreme', label: '极度风险', color: '#b229d1', checked: false },
  { key: 'exceptional', label: '特大风险', color: '#ff2036', checked: false },
  { key: 'severe', label: '重大风险', color: '#f34a2e', checked: false },
  { key: 'major', label: '较大风险', color: '#ff7c25', checked: false },
  { key: 'medium', label: '中度风险', color: '#f2b12a', checked: false },
  { key: 'mild', label: '轻度风险', color: '#21d898', checked: false },
])

const activeTool = ref('location')

const emitSelection = () => {
  emit('change', {
    eventTypes: eventOptions.value.filter((item) => item.checked).map((item) => item.key),
    warningLevels: warningOptions.value.filter((item) => item.checked).map((item) => item.key),
    toolMode: activeTool.value,
  })
}

watch([eventOptions, warningOptions, activeTool], emitSelection, {
  deep: true,
  immediate: true,
})
</script>

<template>
  <aside class="outage-analysis-map-controls" aria-label="地图事件筛选">
    <div class="outage-analysis-filter-card">
      <svg class="map-filter-frame" viewBox="0 0 190 350" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="map-filter-surface" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#07536c" stop-opacity="0.96" />
            <stop offset="0.48" stop-color="#033a58" stop-opacity="0.97" />
            <stop offset="1" stop-color="#022840" stop-opacity="0.98" />
          </linearGradient>
          <linearGradient id="map-filter-outline" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#23d6e0" />
            <stop offset="0.48" stop-color="#0a8da9" />
            <stop offset="1" stop-color="#21cad6" />
          </linearGradient>
          <filter id="map-filter-frame-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          class="map-filter-frame-surface"
          d="M1 21 L19 1 H161 L189 27 V42 L180 54 V326 L169 349 H30 L1 334 Z"
        />
        <path class="map-filter-frame-texture" d="M179 174 L124 273 M180 213 L142 285 M180 252 L157 304" />
        <path class="map-filter-frame-left-texture" d="M2 273 L42 343 M2 300 L29 345" />
        <path
          class="map-filter-frame-inner"
          d="M6 23 L21 6 H159 L184 29 V40 L175 52 V323 L166 343 H33 L6 331 Z"
        />
        <path class="map-filter-frame-top-accent" d="M21 4 H160 L186 28 V41 L178 52" />
        <path class="map-filter-frame-bottom-accent" d="M7 330 L34 345 H167 L177 324" />
        <path
          class="map-filter-frame-outline"
          d="M1 21 L19 1 H161 L189 27 V42 L180 54 V326 L169 349 H30 L1 334 Z"
        />
      </svg>

      <section class="map-filter-section">
        <div class="map-filter-title">
          <span>事件标记</span>
          <i aria-hidden="true"></i>
        </div>
        <div class="map-filter-options">
          <label v-for="item in eventOptions" :key="item.key" class="map-filter-option">
            <span class="event-option-icon" :style="{ backgroundColor: item.color, color: item.color }">
              <svg v-if="item.icon === 'users'" viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="7.2" cy="6.4" r="2.5" />
                <circle cx="13.3" cy="7.4" r="2" />
                <path d="M2.8 15.8c.35-3.3 1.85-5 4.45-5s4.1 1.7 4.45 5M11 12c2.8-.75 5.15.55 5.65 3.8" />
              </svg>
              <svg v-else-if="item.icon === 'electricity'" viewBox="0 0 20 20" aria-hidden="true">
                <path class="event-icon-fill" d="M11.2 1.8 4.7 11h4.4l-.8 7.2 7-10.2h-4.5l.4-6.2Z" />
              </svg>
              <svg v-else viewBox="0 0 20 20" aria-hidden="true">
                <path class="event-icon-fill" d="m10 1.8 2.35 4.75 5.25.77-3.8 3.7.9 5.23L10 13.78l-4.7 2.47.9-5.23-3.8-3.7 5.25-.77L10 1.8Z" />
              </svg>
            </span>
            <span class="map-filter-label">{{ item.label }}</span>
            <input v-model="item.checked" class="map-filter-checkbox" type="checkbox" />
            <span class="map-filter-checkmark" aria-hidden="true"></span>
          </label>
        </div>
      </section>

      <section class="map-filter-section warning-section">
        <div class="map-filter-title">
          <span>频繁停电预警</span>
          <i aria-hidden="true"></i>
        </div>
        <div class="map-filter-options">
          <label v-for="item in warningOptions" :key="item.key" class="map-filter-option">
            <span class="warning-option-dot" :style="{ backgroundColor: item.color, color: item.color }"></span>
            <span class="map-filter-label">{{ item.label }}</span>
            <input v-model="item.checked" class="map-filter-checkbox" type="checkbox" />
            <span class="map-filter-checkmark" aria-hidden="true"></span>
          </label>
        </div>
      </section>
    </div>

    <div class="map-control-tools" aria-label="地图工具">
      <button
        type="button"
        title="定位模式"
        :class="{ active: activeTool === 'location' }"
        :aria-pressed="activeTool === 'location'"
        @click="activeTool = 'location'"
      >
        <span class="map-tool-platform"></span>
        <svg viewBox="0 0 32 36" aria-hidden="true">
          <path d="M16 2C9.4 2 4 7.2 4 13.7 4 23 16 34 16 34s12-11 12-20.3C28 7.2 22.6 2 16 2Z" />
          <circle cx="16" cy="13.5" r="4.8" />
        </svg>
      </button>

      <button
        type="button"
        title="图层模式"
        :class="{ active: activeTool === 'layers' }"
        :aria-pressed="activeTool === 'layers'"
        @click="activeTool = 'layers'"
      >
        <span class="map-tool-platform"></span>
        <svg class="layers-icon" viewBox="0 0 38 34" aria-hidden="true">
          <path d="m19 2 16 8-16 8L3 10 19 2Z" />
          <path d="m5 16 14 7 14-7" />
          <path d="m5 22 14 7 14-7" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.outage-analysis-map-controls {
  width: 190px;
  position: absolute;
  right: calc(max(380px, 30vw) + 28px);
  bottom: 10px;
  z-index: 24;
  display: grid;
  gap: 12px;
  color: #d9fbff;
  font-size: 13px;
  pointer-events: auto;
  user-select: none;
  filter: drop-shadow(0 8px 14px rgba(0, 13, 27, 0.48));
}

.outage-analysis-filter-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 8px 9px 14px;
  border: 0;
  background: transparent;
}

.map-filter-frame {
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.map-filter-frame-surface {
  fill: url(#map-filter-surface);
}

.map-filter-frame-outline {
  fill: none;
  stroke: url(#map-filter-outline);
  stroke-width: 1.7;
  vector-effect: non-scaling-stroke;
  filter: url(#map-filter-frame-glow);
}

.map-filter-frame-inner {
  fill: none;
  stroke: rgba(65, 220, 227, 0.22);
  stroke-width: 0.8;
  vector-effect: non-scaling-stroke;
}

.map-filter-frame-top-accent,
.map-filter-frame-bottom-accent {
  fill: none;
  stroke: rgba(57, 223, 230, 0.34);
  stroke-width: 0.7;
  vector-effect: non-scaling-stroke;
}

.map-filter-frame-bottom-accent {
  stroke: rgba(41, 200, 217, 0.48);
}

.map-filter-frame-texture,
.map-filter-frame-left-texture {
  fill: none;
  stroke: rgba(12, 188, 207, 0.13);
  stroke-width: 7;
  vector-effect: non-scaling-stroke;
}

.map-filter-frame-left-texture {
  stroke: rgba(16, 202, 213, 0.08);
  stroke-width: 4;
}

.map-filter-section + .map-filter-section {
  margin-top: 6px;
}

.map-filter-title {
  height: 28px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
  border-bottom: 1px solid rgba(32, 210, 219, 0.55);
  color: #ecffff;
  font-size: 14px;
  font-weight: 700;
  text-shadow: 0 0 7px rgba(49, 229, 237, 0.42);
  background: linear-gradient(90deg, rgba(13, 154, 171, 0.28), transparent 88%);
}

.map-filter-title i {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #8fe9ed;
  transform: translateY(2px);
}

.map-filter-options {
  display: grid;
  padding-top: 3px;
}

.map-filter-option {
  min-height: 28px;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 7px;
  padding: 2px 10px 2px 3px;
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.16s ease;
}

.map-filter-option:hover {
  background: rgba(29, 207, 215, 0.12);
}

.event-option-icon {
  width: 17px;
  height: 17px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 50%;
  box-shadow: 0 0 7px currentColor;
}

.event-option-icon svg {
  width: 13px;
  height: 13px;
  overflow: visible;
  fill: none;
  stroke: #ffffff;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.event-option-icon .event-icon-fill {
  fill: #ffffff;
  stroke: none;
}

.warning-option-dot {
  width: 9px;
  height: 9px;
  justify-self: center;
  border-radius: 50%;
  box-shadow: 0 0 7px currentColor;
}

.map-filter-label {
  min-width: 0;
  overflow: hidden;
  color: #ccecf1;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-filter-checkbox {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.map-filter-checkmark {
  width: 15px;
  height: 15px;
  position: relative;
  justify-self: end;
  border: 1px solid rgba(110, 248, 239, 0.9);
  border-radius: 1px;
  background: rgba(216, 255, 247, 0.95);
  box-shadow: 0 0 5px rgba(49, 228, 224, 0.28);
}

.map-filter-checkbox:focus-visible + .map-filter-checkmark {
  outline: 2px solid #77ffff;
  outline-offset: 2px;
}

.map-filter-checkbox:checked + .map-filter-checkmark {
  border-color: #36eee5;
  background: linear-gradient(180deg, #43eee1, #08aeb8);
}

.map-filter-checkbox:checked + .map-filter-checkmark::after {
  content: "";
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid #ffffff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.map-control-tools {
  height: 58px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 0 9px;
}

.map-control-tools button {
  width: 58px;
  height: 58px;
  position: relative;
  display: grid;
  place-items: start center;
  border: 0;
  outline: 0;
  color: #14cad4;
  background: transparent;
  padding: 0;
  cursor: pointer;
  filter: drop-shadow(0 5px 7px rgba(0, 0, 0, 0.5));
}

.map-control-tools button:first-child {
  color: #16d7a7;
}

.map-control-tools button:hover,
.map-control-tools button.active {
  filter: drop-shadow(0 0 10px currentColor) drop-shadow(0 5px 7px rgba(0, 0, 0, 0.46));
}

.map-control-tools svg {
  width: 28px;
  height: 34px;
  position: relative;
  z-index: 2;
  overflow: visible;
  fill: currentColor;
  stroke: #8bfff2;
  stroke-width: 1.4;
}

.map-control-tools svg circle {
  fill: #043f59;
}

.map-control-tools .layers-icon {
  width: 34px;
  stroke-width: 2.2;
  fill: rgba(12, 175, 198, 0.54);
}

.map-tool-platform {
  width: 50px;
  height: 15px;
  position: absolute;
  left: 4px;
  bottom: 2px;
  z-index: 1;
  transform: perspective(32px) rotateX(48deg);
  border: 1px solid currentColor;
  background: linear-gradient(180deg, rgba(28, 249, 229, 0.62), rgba(1, 64, 83, 0.92));
  box-shadow:
    0 -5px 0 -2px rgba(5, 116, 133, 0.9),
    0 -9px 0 -4px rgba(11, 214, 207, 0.74),
    0 0 12px currentColor;
}

@media (max-height: 760px) {
  .outage-analysis-map-controls {
    width: 178px;
    gap: 7px;
    font-size: 12px;
  }

  .map-filter-option {
    min-height: 24px;
  }

  .map-filter-title {
    height: 25px;
    font-size: 13px;
  }

  .map-control-tools,
  .map-control-tools button {
    height: 50px;
  }
}

@media (max-width: 1240px) {
  .outage-analysis-map-controls {
    right: 28px;
  }
}
</style>
