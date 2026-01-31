export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-20 py-8">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Powered by</span>
          <span className="text-blue-400 font-medium">ENS</span>
          <span>&middot;</span>
          <span className="text-purple-400 font-medium">LI.FI</span>
          <span>&middot;</span>
          <span className="text-green-400 font-medium">Circle</span>
        </div>
        <p className="text-sm text-gray-600">ETHGlobal HackMoney 2025</p>
      </div>
    </footer>
  )
}
