"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { HistoryItem } from "@/components/history-item"
import { getDailyVolume, getOngoingTrips, getTripHistory } from "@/lib/db-service"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

type Tab = "painel" | "tempo-real" | "historico"

export default function Dashboard() {
  
  const [activeTab, setActiveTab] = useState<Tab>("painel")
  const [volumeData, setVolumeData] = useState<any[]>([])
  const [ongoingTrips, setOngoingTrips] = useState<any[]>([])
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [totalMonthVolume, setTotalMonthVolume] = useState(0)
  const [totalWeekTrips, setTotalWeekTrips] = useState(0)
  const [averageTripTime, setAverageTripTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("Usuário não autenticado, redirecionando...")
      router.push("/")
    }
  }, [authLoading, user, router])
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)

      // Carregar dados de volume diário
      try {
        const volumeData = await getDailyVolume(7)
        setVolumeData(
          volumeData.map((item: any) => ({
            name: formatDayName(item.date),
            Volume: item.total_volume,
          })),
        )

        // Calcular volume total do mês
        const monthVolume = volumeData.reduce((acc: number, curr: any) => acc + curr.total_volume, 0)
        setTotalMonthVolume(monthVolume)
      } catch (e) {
        console.error("Erro ao carregar dados de volume:", e)
        // Dados fictícios em caso de erro
        const dummyData = generateDummyVolumeData(7)
        setVolumeData(dummyData)
        setTotalMonthVolume(dummyData.reduce((acc, curr) => acc + curr.Volume, 0))
      }

      // Carregar viagens em andamento
      try {
        const trips = await getOngoingTrips()
        setOngoingTrips(
          trips.map((trip: any) => ({
            id: trip.id,
            project: trip.projects?.name || "Projeto Desconhecido",
            truck: trip.trucks?.name || "Caminhão Desconhecido",
            startTime: formatTime(trip.start_time),
            estimatedEnd: trip.estimated_end_time ? formatTime(trip.estimated_end_time) : "N/A",
          })),
        )

        // Calcular total de viagens da semana
        setTotalWeekTrips(trips.length)
      } catch (e) {
        console.error("Erro ao carregar viagens em andamento:", e)
        setOngoingTrips([])
        setTotalWeekTrips(0)
      }

      // Calcular tempo médio de viagem (exemplo simples)
      setAverageTripTime(45) // Valor fixo por enquanto, pode ser calculado com dados reais

      // Carregar histórico de viagens
      try {
        // Aqui estamos passando 3 como limite, não como dias
        const history = await getTripHistory(3)
        setHistoryItems(
          history.map((item: any) => ({
            id: item.id,
            date: formatDate(item.end_time),
            time: formatTime(item.end_time),
            coordinate: item.coordinates || "N/A",
            photoUrl: item.photo_url || "/placeholder.svg?height=100&width=150",
            material: item.material,
          })),
        )
      } catch (e) {
        console.error("Erro ao carregar histórico de viagens:", e)
        setHistoryItems([])
        toast({
          title: "Erro",
          description: "Não foi possível carregar o histórico de viagens. Tente novamente mais tarde.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setError("Ocorreu um erro ao carregar os dados. Por favor, tente novamente mais tarde.")
    } finally {
      setLoading(false)
    }
  }

  // Função para gerar dados fictícios de volume
  function generateDummyVolumeData(days: number) {
    const result = []
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
    const today = new Date()
    const dayOfWeek = today.getDay()

    for (let i = 0; i < days; i++) {
      const dayIndex = (dayOfWeek - i + 7) % 7
      result.unshift({
        name: dayNames[dayIndex],
        Volume: Math.floor(Math.random() * 500) + 100,
      })
    }

    return result
  }

  // Funções auxiliares para formatação
  function formatDayName(dateStr: string) {
    try {
      const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
      const date = new Date(dateStr)
      return days[date.getDay()]
    } catch (e) {
      return "N/A"
    }
  }

  function formatDate(dateStr: string) {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("pt-BR")
    } catch (e) {
      return "N/A"
    }
  }

  function formatTime(dateStr: string) {
    try {
      const date = new Date(dateStr)
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    } catch (e) {
      return "N/A"
    }
  }

  const renderPainelContent = () => (
    <div className="grid grid-cols-1 gap-4">
      {error && <div className="bg-red-500 text-white p-4 rounded-md">{error}</div>}
      <Card className="bg-black text-[#F2BE13]">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-2">Total m³ Este Mês</h3>
          <p className="text-4xl font-bold">
            {loading ? "Carregando..." : `${totalMonthVolume.toLocaleString("pt-BR")} m³`}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-black text-[#F2BE13]">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-2">Total de Viagens Esta Semana</h3>
          <p className="text-4xl font-bold">{loading ? "Carregando..." : totalWeekTrips}</p>
        </CardContent>
      </Card>
      <Card className="bg-black text-[#F2BE13]">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-2">Tempo Médio de Viagem</h3>
          <p className="text-4xl font-bold">{loading ? "Carregando..." : `${averageTripTime} min`}</p>
        </CardContent>
      </Card>
      <Card className="bg-black text-[#F2BE13]">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">m³ Removidos Diariamente</h3>
          <div className="h-[200px] w-full">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <p>Carregando dados...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Volume" fill="#F2BE13" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTempoRealContent = () => (
    <div className="space-y-4">
      {loading ? (
        <p className="text-center">Carregando viagens em andamento...</p>
      ) : ongoingTrips.length > 0 ? (
        ongoingTrips.map((trip) => (
          <Card key={trip.id} className="bg-black text-[#F2BE13]">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{trip.project}</h3>
                  <span className="text-sm bg-[#F2BE13]/20 px-2 py-1 rounded">Em Andamento</span>
                </div>
                <p className="text-sm">{trip.truck}</p>
                <div className="flex justify-between text-xs mt-2">
                  <div>
                    <p className="text-[#F2BE13]/70">Início</p>
                    <p>{trip.startTime}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#F2BE13]/70">Fim Estimado</p>
                    <p>{trip.estimatedEnd}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-center">Nenhuma viagem em andamento no momento.</p>
      )}
    </div>
  )

  const renderHistoricoContent = () => (
    <div className="space-y-4">
      {loading ? (
        <p className="text-center">Carregando histórico...</p>
      ) : historyItems.length > 0 ? (
        historyItems.map((item) => <HistoryItem key={item.id} {...item} />)
      ) : (
        <p className="text-center">Nenhum histórico disponível.</p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex gap-2 md:hidden">
        <Button
          variant={activeTab === "painel" ? "default" : "outline"}
          className={`flex-1 ${activeTab === "painel" ? "bg-black text-[#F2BE13]" : "text-black border-black"}`}
          onClick={() => setActiveTab("painel")}
        >
          Painel
        </Button>
        <Button
          variant={activeTab === "tempo-real" ? "default" : "outline"}
          className={`flex-1 ${activeTab === "tempo-real" ? "bg-black text-[#F2BE13]" : "text-black border-black"}`}
          onClick={() => setActiveTab("tempo-real")}
        >
          Tempo Real
        </Button>
        <Button
          variant={activeTab === "historico" ? "default" : "outline"}
          className={`flex-1 ${activeTab === "historico" ? "bg-black text-[#F2BE13]" : "text-black border-black"}`}
          onClick={() => setActiveTab("historico")}
        >
          Histórico
        </Button>
      </div>

      <div className="md:hidden">
        {activeTab === "painel" && renderPainelContent()}
        {activeTab === "tempo-real" && renderTempoRealContent()}
        {activeTab === "historico" && renderHistoricoContent()}
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-6">{renderPainelContent()}</div>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Tempo Real</h2>
              {renderTempoRealContent()}
            </div>
          </div>
        </div>
        <div className="w-full">
          <h2 className="text-xl font-bold mb-4">Histórico do Dia</h2>
          {renderHistoricoContent()}
        </div>
      </div>
    </div>
  )
}

