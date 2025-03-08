import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface HistoryItemProps {
  date: string
  time: string
  coordinate: string
  photoUrl: string
  material: string
}

export function HistoryItem({ date, time, coordinate, photoUrl, material }: HistoryItemProps) {
  return (
    <Card className="bg-black text-[#F2BE13]">
      <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-shrink-0">
          <Image
            src={photoUrl || "/placeholder.svg?height=100&width=150"}
            alt="Truck photo"
            width={150}
            height={100}
            className="rounded-md object-cover"
          />
        </div>
        <div className="flex-grow">
          <p className="font-semibold">
            {date} - {time}
          </p>
          <p>Coordenada: {coordinate}</p>
          <p>Material: {material}</p>
        </div>
      </CardContent>
    </Card>
  )
}

