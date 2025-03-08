"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const ongoingTrips = [
  { id: 1, project: "Projeto A", truck: "Caminhão 001", startTime: "09:30", estimatedEnd: "10:15" },
  { id: 2, project: "Projeto B", truck: "Caminhão 002", startTime: "09:45", estimatedEnd: "10:30" },
  { id: 3, project: "Projeto C", truck: "Caminhão 003", startTime: "10:00", estimatedEnd: "10:45" },
]

const projectProgress = [
  { id: 1, name: "Projeto A", progress: 75 },
  { id: 2, name: "Projeto B", progress: 40 },
  { id: 3, name: "Projeto C", progress: 90 },
]

export default function RealTime() {
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold text-black">Informações em Tempo Real</h1>
      <Card className="bg-black text-[#F2BE13]">
        <CardHeader>
          <CardTitle>Viagens em Andamento</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Projeto</th>
                <th className="text-left">Caminhão</th>
                <th className="text-left">Hora de Início</th>
                <th className="text-left">Fim Estimado</th>
              </tr>
            </thead>
            <tbody>
              {ongoingTrips.map((trip) => (
                <tr key={trip.id}>
                  <td>{trip.project}</td>
                  <td>{trip.truck}</td>
                  <td>{trip.startTime}</td>
                  <td>{trip.estimatedEnd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card className="bg-black text-[#F2BE13]">
        <CardHeader>
          <CardTitle>Progresso do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          {projectProgress.map((project) => (
            <div key={project.id} className="mb-4">
              <div className="flex justify-between mb-1">
                <span>{project.name}</span>
                <span>{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

