"use client"
import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface TimelineItem {
  title: string
  description: string
  date?: string
  image?: string
  status?: "completed" | "current" | "upcoming"
  category?: string
  icon?: string
}

export function Timeline({ items, className }: { 
  items: TimelineItem[]
  className?: string 
}) {
  return (
    <section className={cn("w-full max-w-2xl mx-auto px-4 py-8", className)}>
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-brand-orange/20" />
        <motion.div
          className="absolute left-6 top-0 w-px bg-brand-orange origin-top"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true }}
        />
        <div className="space-y-8 relative">
          {items.map((item, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
              viewport={{ once: true, margin: "-30px" }}
            >
              <div className="flex items-start gap-5">
                <div className="relative flex-shrink-0 mt-1">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-brand-orange flex items-center justify-center text-2xl shadow-sm z-10 relative">
                    {item.icon || '🐄'}
                  </div>
                </div>
                <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-brand-gray-light/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-bold text-lg text-brand-dark">
                      {item.title}
                    </h3>
                    {item.date && (
                      <span className="font-body text-xs text-brand-gray bg-brand-warm px-2 py-1 rounded-full">
                        {item.date}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-brand-gray text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
