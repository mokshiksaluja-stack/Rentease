import React from "react";
import { motion } from "framer-motion";

export default function TypingIndicator({ username = "Someone" }) {
  const dotVariants = {
    start: {
      y: "0%"
    },
    animate: {
      y: "100%"
    }
  };

  const dotTransition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: "reverse",
    ease: "easeInOut"
  };

  return (
    <div className="flex items-center space-x-2 p-3 bg-slate-900/50 border border-slate-700/40 rounded-2xl w-fit max-w-[80%] my-2 select-none">
      <span className="text-xs text-slate-400 font-medium">{username} is typing</span>
      <div className="flex space-x-1 items-center h-2">
        <motion.span
          className="w-1.5 h-1.5 bg-slate-400 rounded-full"
          variants={dotVariants}
          initial="start"
          animate="animate"
          transition={{ ...dotTransition, delay: 0 }}
        />
        <motion.span
          className="w-1.5 h-1.5 bg-slate-400 rounded-full"
          variants={dotVariants}
          initial="start"
          animate="animate"
          transition={{ ...dotTransition, delay: 0.15 }}
        />
        <motion.span
          className="w-1.5 h-1.5 bg-slate-400 rounded-full"
          variants={dotVariants}
          initial="start"
          animate="animate"
          transition={{ ...dotTransition, delay: 0.3 }}
        />
      </div>
    </div>
  );
}
