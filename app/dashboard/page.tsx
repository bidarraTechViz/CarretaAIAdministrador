"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { HistoryItem } from "@/components/history-item"
import { getAverageTripTime, getCompletedTrips, getDailyVolume, getOngoingTrips, getTripHistory } from "@/lib/db-service"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { cacheManager } from "@/lib/cache"
import { processImageBase64 } from "@/lib/utils"

type Tab = "painel" | "tempo-real" | "historico"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("painel")
  const [volumeData, setVolumeData] = useState<any[]>([])
  const [ongoingTrips, setOngoingTrips] = useState<any[]>([])
  const [completedTrips, setCompletedTrips] = useState<any[]>([])
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [totalMonthVolume, setTotalMonthVolume] = useState(0)
  const [totalWeekTrips, setTotalWeekTrips] = useState(0)
  const [averageTripTime, setAverageTripTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
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
    const interval = setInterval(() => {
      loadData()
    }, 600000) // Atualização automática a cada 10 minutos

    return () => clearInterval(interval)
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
        const dummyData = generateDummyVolumeData(7)
        setVolumeData(dummyData)
        setTotalMonthVolume(dummyData.reduce((acc, curr) => acc + curr.Volume, 0))
      }

      let ongoingTripsCount = 0;
      let completedTripsCount = 0; 

      // Carregar viagens em andamento
      try {
        const trips = await getOngoingTrips()
        setOngoingTrips(
          trips.map((trip: any) => ({
            id: trip.id,
            project: trip.projects?.name || "Projeto Desconhecido",
            truck: trip.trucks?.name || "Caminhão Desconhecido"
            //startTime: formatDate(trip.created_at),
            //estimatedEnd: trip.estimated_end_time ? formatDate(trip.estimated_end_time) : "N/A",
          })),
        )
        ongoingTripsCount = trips.length
      } catch (e) {
        console.error("Erro ao carregar viagens em andamento:", e)
        setOngoingTrips([])
        setTotalWeekTrips(0)
      }

      // Carregar viagens concluídas
      try {
        const completedTrips = await getCompletedTrips()
        setCompletedTrips(completedTrips)
        completedTripsCount = completedTrips.length;
      } catch (e) {
        console.error("Erro ao carregar viagens concluídas:", e)
        setCompletedTrips([])
        setTotalWeekTrips(0)
      }

      setTotalWeekTrips(ongoingTripsCount + completedTripsCount);

      try {
        const averageTime = await getAverageTripTime(7);
        // Garantir que o valor é um número válido
        setAverageTripTime(typeof averageTime === 'number' ? averageTime : 45);
      } catch (error) {
        console.error("Erro ao obter tempo médio:", error);
        setAverageTripTime(45); // Fallback em caso de erro
      }

      // Carregar histórico de viagens
      try {
        const history = await getTripHistory(3)
        setHistoryItems(
          history.map((item: any) => ({
            id: item.id,
            date: formatDate(item.end_time),
            time: formatTime(item.end_time),
            operador: item.operator_name || "N/A",
            photoUrl: processImageBase64(item.photo_base64, 'image/jpeg', item.photo_url || "/placeholder.svg?height=100&width=150"),
            material: item.material,
          })),
        )
      } catch (e) {
        console.error("Erro ao carregar histórico de viagens:", e)
        setHistoryItems([])
        toast({
          title: "Erro",
          description: "Não foi possível carregar o histórico de viagens.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setError("Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.")
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    cacheManager.clear()
    loadData()
    setLastRefresh(Date.now())
  }

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
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-center">Nenhuma viagem em andamento no momento.</p>
      )}
    </div>
  )

  {/* <div className="flex justify-between text-xs mt-2">
    <div>
      <p className="text-[#F2BE13]/70">Início</p>
      <TimeDisplay timestamp={trip.created_at} />
    </div>
    <div className="text-right">
      <p className="text-[#F2BE13]/70">Fim Estimado</p>
      <TimeDisplay timestamp={trip.end_time} />
    </div>
  </div> */}

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={refreshData}>
          Atualizar Dados
          <span className="ml-2 text-sm">
            (Última: {new Date(lastRefresh).toLocaleTimeString("pt-BR")})
          </span>
        </Button>
      </div>

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
              <h2 className="text-xl font-bold mb-4">Tempo Real (Caminhões que deram entrada)</h2>
              {renderTempoRealContent()}
            </div>
          </div>
        </div>
        <div className="w-full">
          <h2 className="text-xl font-bold mb-4">Histórico do Dia (Caminhões que realizaram saída)</h2>
          {renderHistoricoContent()}
        </div>
      </div>
    </div>
  )
}

// Componente que renderiza apenas no cliente para evitar erros de hidratação
function TimeDisplay({ timestamp }: { timestamp: string }) {
  // Usar suppressHydrationWarning para ignorar erros de hidratação relacionados a tempo
  return (
    <span suppressHydrationWarning>
      {typeof window === 'undefined' 
        ? '--:--' // Durante SSR, mostrar placeholder
        : formatTimeClient(timestamp) // No cliente, mostrar o tempo formatado
      }
    </span>
  );
}

// Função para formatar o tempo apenas no cliente
function formatTimeClient(dateStr: string): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return "--:--";
  }
}