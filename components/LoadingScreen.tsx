'use client'
import { motion } from 'framer-motion'

export default function LoadingScreen({ message = 'Connecting to your network...' }: { message?: string }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      background: '#f9fafb',
      zIndex: 999,
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
        style={{ fontSize: 64, lineHeight: 1 }}
      >
        <motion.span
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ display: 'block' }}
        >
          🍀
        </motion.span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginTop: 20 }}
      >
        Clover
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        style={{ fontSize: 13, color: '#888', marginTop: 8 }}
      >
        {message}
      </motion.p>

      <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            style={{ width: 7, height: 7, borderRadius: '50%', background: '#1a7a4a', display: 'block' }}
          />
        ))}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: 3, background: '#e5e7eb' }}>
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
          style={{ height: '100%', background: '#1a7a4a' }}
        />
      </div>
    </div>
  )
}