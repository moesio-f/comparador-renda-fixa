<script lang="ts" module>
  import type { SeriesPoint } from '../state/results';

  export interface Series {
    label: string;
    /** Position in the asset list; fixes the color. */
    index: number;
    points: SeriesPoint[];
  }
</script>

<script lang="ts">
  import {
    Chart,
    Legend,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
    type ChartConfiguration,
  } from 'chart.js';
  import { toDayNumber } from '../data/business-days';
  import { formatCurrency, formatDate } from '../format';
  import { theme } from '../state/theme.svelte';

  Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Legend);

  let { series }: { series: Series[] } = $props();

  let canvas: HTMLCanvasElement;
  let probe: HTMLSpanElement;

  const DAY_MS = 86_400_000;
  const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' });
  const compactCurrency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  $effect(() => {
    void theme.current; // Rebuild with the other theme's colors.
    // Tokens hold light-dark() pairs, which canvas can't parse; resolve them through an element.
    const token = (name: string) => {
      probe.style.color = `var(${name})`;
      return getComputedStyle(probe).color;
    };

    const xs = series.flatMap((s) => s.points.map((p) => toDayNumber(p.date) * DAY_MS));

    const config: ChartConfiguration<'line', { x: number; y: number }[]> = {
      type: 'line',
      data: {
        datasets: series.map((s) => {
          const color = token(`--series-${(s.index % 8) + 1}`);
          return {
            label: s.label,
            data: s.points.map((p) => ({ x: toDayNumber(p.date) * DAY_MS, y: p.net })),
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBorderWidth: 2,
            pointHoverBorderColor: token('--surface'),
            tension: 0,
          };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            type: 'linear',
            min: Math.min(...xs),
            max: Math.max(...xs),
            grid: { display: false },
            border: { color: token('--border-strong') },
            ticks: {
              color: token('--text-3'),
              maxTicksLimit: 7,
              callback: (v) => monthFormat.format(new Date(Number(v))),
            },
          },
          y: {
            grid: { color: token('--border') },
            border: { display: false },
            ticks: { color: token('--text-3'), callback: (v) => compactCurrency.format(Number(v)) },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'start',
            labels: { color: token('--text-2'), boxWidth: 10, boxHeight: 10, useBorderRadius: true, borderRadius: 3 },
          },
          tooltip: {
            backgroundColor: token('--surface'),
            titleColor: token('--text'),
            bodyColor: token('--text-2'),
            borderColor: token('--border-strong'),
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              title: (items) => formatDate(new Date(items[0]!.parsed.x!).toISOString().slice(0, 10)),
              label: (item) => `${item.dataset.label}: ${formatCurrency(item.parsed.y!)}`,
            },
          },
        },
      },
    };

    const chart = new Chart(canvas, config);
    return () => chart.destroy();
  });
</script>

<figure class="chart card">
  <figcaption class="section-label">Valor líquido se resgatado em cada data</figcaption>
  <div class="canvas">
    <canvas bind:this={canvas} aria-label="Gráfico do valor líquido de cada ativo, mês a mês, até o vencimento"
    ></canvas>
  </div>
  <span bind:this={probe} hidden></span>
</figure>

<style>
  .chart {
    margin: 0;
    padding: 16px;
  }

  figcaption {
    margin-bottom: 8px;
  }

  .canvas {
    position: relative;
    height: 320px;
  }
</style>
