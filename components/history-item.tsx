import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface HistoryItemProps {
  date: string
  time: string
  operador: string
  photoUrl: string
  material: string
}

export function HistoryItem({ date, time, operador, photoUrl, material }: HistoryItemProps) {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Verificar se a URL é base64
  const isBase64 = photoUrl && photoUrl.startsWith('data:');
  
  // URL da imagem (base64 ou URL normal)
  const imageUrl = !imageError && photoUrl ? photoUrl : "/placeholder.svg?height=100&width=150";
  
  // Função para lidar com erros de carregamento de imagem
  const handleImageError = () => {
    console.error("Erro ao carregar imagem:", photoUrl?.substring(0, 50) + "...");
    setImageError(true);
  };
  
  // Função para lidar com o carregamento bem-sucedido da imagem
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  // Resetar o estado de erro quando a URL da imagem mudar
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [photoUrl]);
  
  return (
    <Card className="bg-black text-[#F2BE13]">
      <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-shrink-0 cursor-pointer" onClick={() => setIsImageOpen(true)}>
          <div className="relative w-[150px] h-[100px]">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                <span className="text-xs text-[#F2BE13]">Carregando...</span>
              </div>
            )}
            
            {isBase64 ? (
              // Para imagens base64, usamos uma tag img normal para melhor suporte
              <img
                src={imageUrl}
                alt="Foto da viagem"
                width={150}
                height={100}
                className="rounded-md object-cover w-[150px] h-[100px]"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            ) : (
              // Para URLs normais, usamos o componente Image do Next.js
              <Image
                src={imageUrl}
                alt="Foto da viagem"
                width={150}
                height={100}
                className="rounded-md object-cover"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            )}
          </div>
          <div className="text-xs text-center mt-1 text-[#F2BE13]/70">Clique para ampliar</div>
        </div>
        <div className="flex-grow">
          <p className="font-semibold">
            {date} - {time}
          </p>
          <p>Operador: {operador}</p>
          <p>Material: {material}</p>
        </div>
      </CardContent>
      
      {/* Diálogo para exibir a imagem em tamanho real */}
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent className="bg-black border-[#F2BE13] max-w-4xl">
          <div className="flex justify-center">
            {isBase64 ? (
              <img
                src={imageUrl}
                alt="Foto da viagem em tamanho real"
                className="max-h-[80vh] max-w-full object-contain"
                onError={handleImageError}
              />
            ) : (
              <Image
                src={imageUrl}
                alt="Foto da viagem em tamanho real"
                width={800}
                height={600}
                className="max-h-[80vh] max-w-full object-contain"
                onError={handleImageError}
              />
            )}
          </div>
          <div className="text-center text-[#F2BE13]">
            <p className="font-semibold">{date} - {time}</p>
            <p>Material: {material}</p>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

