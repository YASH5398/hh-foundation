import { motion } from "framer-motion";

export default function PlaceholderCard({ slot }) {
  return (
    <motion.div
      className="rounded-3xl bg-white/30 border-2 border-dashed border-gray-300 shadow-lg flex flex-col items-center justify-center p-8 min-h-[300px] backdrop-blur"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-5xl mb-2">🕓</div>
      <div className="font-bold text-lg text-gray-700">Sender {slot}</div>
      <div className="text-gray-500 mt-2">Coming Shortly</div>
    </motion.div>
  );
} 