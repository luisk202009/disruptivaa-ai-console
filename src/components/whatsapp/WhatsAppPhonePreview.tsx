import { Check } from "lucide-react";

interface Props {
  phone: string;
  message: string;
}

const WhatsAppPhonePreview = ({ phone, message }: Props) => {
  const displayPhone = phone ? `+${phone}` : "+57 300 000 0000";
  const displayMessage =
    message || "Tu mensaje predeterminado aparecerá aquí en tiempo real.";

  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div className="rounded-[2.5rem] border-[10px] border-zinc-900 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="h-6 bg-zinc-900 flex justify-center items-end pb-1">
          <div className="w-20 h-4 bg-black rounded-full" />
        </div>

        {/* WhatsApp header */}
        <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {displayPhone}
            </p>
            <p className="text-white/70 text-xs">en línea</p>
          </div>
        </div>

        {/* Chat background */}
        <div
          className="px-3 py-6 min-h-[340px] flex flex-col justify-end"
          style={{
            backgroundColor: "#ECE5DD",
            backgroundImage:
              "radial-gradient(circle at 25% 25%, rgba(0,0,0,0.03) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <div className="flex justify-end">
            <div className="max-w-[85%] bg-[#DCF8C6] rounded-lg rounded-tr-none px-3 py-2 shadow-sm">
              <p className="text-zinc-800 text-sm whitespace-pre-wrap break-words">
                {displayMessage}
              </p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-zinc-500">12:00</span>
                <Check size={12} className="text-zinc-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPhonePreview;
