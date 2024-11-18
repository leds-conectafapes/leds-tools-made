import * as fs from 'fs';
import * as path from 'path';
import { TimeBoxDTO } from '../../../../../project_management_integration/dto/models.js';

export class ProjectCFD {
  private sprints: TimeBoxDTO[];
  private readonly outputPath: string;

  constructor(sprints: TimeBoxDTO[], outputPath: string = './project-cfd.svg') {
    this.sprints = sprints.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    this.outputPath = outputPath;
  }

  private processData() {
    const formatDate = (date: Date) => {
      const dia = date.getDate().toString().padStart(2, '0');
      const mes = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${dia}/${mes}`;
    };

    const startDate = new Date(this.sprints[0].startDate);
    const endDate = new Date(this.sprints[this.sprints.length - 1].endDate);
    const days = [];
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const weekDay = currentDate.toLocaleDateString('pt-BR', { weekday: 'short' });
      const formattedDate = formatDate(currentDate);
      
      const allTasksUntilDay = this.sprints.flatMap(sprint => 
        sprint.tasks.filter(task => new Date(task.startDate ?? "") <= currentDate)
      );

      days.push({
        day: `${weekDay} ${formattedDate}`,
        date: new Date(currentDate),
        todo: allTasksUntilDay.filter(task => task.status === "A Fazer").length,
        inProgress: allTasksUntilDay.filter(task => task.status === "Em Andamento").length,
        done: allTasksUntilDay.filter(task => task.status === "Concluído").length
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  private generateSVG(): string {
    const width = 1200;
    const height = 600;
    const margin = { top: 50, right: 150, bottom: 100, left: 70 };
    const colors = {
      todo: '#ef4444',
      inProgress: '#f59e0b',
      done: '#22c55e',
      grid: '#e5e7eb',
      text: '#000000',
      lightText: '#666666'
    };

    const dailyData = this.processData();
    const totalTasks = this.sprints.reduce((sum, sprint) => sum + sprint.tasks.length, 0);
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const xScale = (date: Date) => {
      const startDate = new Date(this.sprints[0].startDate);
      const totalDays = dailyData.length - 1;
      const dayIndex = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return margin.left + (dayIndex * (chartWidth / totalDays));
    };

    const yScale = (value: number) => {
      return height - margin.bottom - (value * (chartHeight / totalTasks));
    };

    const generateArea = (data: any[], getValue: (d: any) => number) => {
      const points = data.map(d => {
        const x = xScale(d.date);
        const y = yScale(getValue(d));
        return `${x},${y}`;
      });

      const bottomPoints = data.map(d => {
        const x = xScale(d.date);
        return `${x},${height - margin.bottom}`;
      }).reverse();

      return `M${points.join(' L')} L${bottomPoints.join(' L')} Z`;
    };

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
        <defs>
          <style>
            text { font-family: Arial, sans-serif; }
            .title { font-size: 24px; font-weight: bold; }
            .label { font-size: 14px; }
            .value { font-size: 12px; fill: ${colors.lightText}; }
            .axis { font-size: 12px; }
            .legend { font-size: 14px; }
          </style>
        </defs>

        <rect width="${width}" height="${height}" fill="white"/>

        ${Array.from({ length: 11 }, (_, i) => {
          const y = margin.top + (i * (chartHeight / 10));
          return `
            <line 
              x1="${margin.left}" 
              y1="${y}" 
              x2="${width - margin.right}" 
              y2="${y}" 
              stroke="${colors.grid}" 
              stroke-dasharray="4"
            />
            <text 
              x="${margin.left - 10}" 
              y="${y}" 
              text-anchor="end" 
              class="axis" 
              dominant-baseline="middle"
            >${Math.round(totalTasks - (i * (totalTasks / 10)))}</text>
          `;
        }).join('')}

        <path 
          d="${generateArea(dailyData, d => d.todo + d.inProgress + d.done)}" 
          fill="${colors.todo}" 
          opacity="0.8"
        />
        <path 
          d="${generateArea(dailyData, d => d.inProgress + d.done)}" 
          fill="${colors.inProgress}" 
          opacity="0.8"
        />
        <path 
          d="${generateArea(dailyData, d => d.done)}" 
          fill="${colors.done}" 
          opacity="0.8"
        />

        <line 
          x1="${margin.left}" 
          y1="${margin.top}" 
          x2="${margin.left}" 
          y2="${height - margin.bottom}" 
          stroke="black" 
          stroke-width="2"
        />
        <line 
          x1="${margin.left}" 
          y1="${height - margin.bottom}" 
          x2="${width - margin.right}" 
          y2="${height - margin.bottom}" 
          stroke="black" 
          stroke-width="2"
        />

        ${dailyData.map((d, i) => {
          if (i % 7 === 0) {  // Show only weekly labels to avoid clutter
            const x = xScale(d.date);
            return `
              <text 
                transform="rotate(-45 ${x} ${height - margin.bottom + 20})"
                x="${x}"
                y="${height - margin.bottom + 20}"
                text-anchor="end"
                class="axis"
              >${d.day}</text>
            `;
          }
          return '';
        }).join('')}

        <text 
          transform="rotate(-90 ${margin.left - 40} ${height/2})" 
          x="${margin.left - 40}" 
          y="${height/2}" 
          text-anchor="middle" 
          class="label"
        >Número de Tarefas</text>

        <text 
          x="${width/2}" 
          y="${height - 20}" 
          text-anchor="middle" 
          class="label"
        >Período do Projeto</text>

        <text 
          x="${width/2}" 
          y="30" 
          text-anchor="middle" 
          class="title"
        >Cumulative Flow Diagram - Projeto Completo</text>

        <g transform="translate(${width - margin.right + 20}, ${margin.top})">
          <rect width="15" height="15" fill="${colors.todo}" rx="2"/>
          <text x="25" y="12" class="legend">A Fazer</text>
          
          <rect y="25" width="15" height="15" fill="${colors.inProgress}" rx="2"/>
          <text x="25" y="37" class="legend">Em Progresso</text>
          
          <rect y="50" width="15" height="15" fill="${colors.done}" rx="2"/>
          <text x="25" y="62" class="legend">Concluído</text>
          
          <text x="0" y="90" class="value">
            Período: ${new Date(this.sprints[0].startDate).toLocaleDateString('pt-BR')} - 
            ${new Date(this.sprints[this.sprints.length - 1].endDate).toLocaleDateString('pt-BR')}
          </text>
          <text x="0" y="110" class="value">
            Total de Tasks: ${totalTasks}
          </text>
          <text x="0" y="130" class="value">
            Total de Sprints: ${this.sprints.length}
          </text>
        </g>
      </svg>
    `;

    return svg;
  }

  public generate(): void {
    const svg = this.generateSVG();
    fs.writeFileSync(this.outputPath, svg);
    console.log(`Project CFD gerado em: ${path.resolve(this.outputPath)}`);
  }
}