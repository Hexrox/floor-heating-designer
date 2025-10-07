function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">
                🏠 Floor Heating Designer
              </h1>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                Zapisz
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                Eksport
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                ?
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Panel Narzędzi */}
          <aside className="col-span-3 bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
              {/* Projekt */}
              <div>
                <h3 className="text-lg font-semibold mb-3">📁 Projekt</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">
                    Nowy
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">
                    Wczytaj JPG
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">
                    Zapisz
                  </button>
                </div>
              </div>

              {/* Parametry */}
              <div>
                <h3 className="text-lg font-semibold mb-3">⚙️ Parametry</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Średnica rury:
                    </label>
                    <div className="space-y-1">
                      <label className="flex items-center">
                        <input type="radio" name="diameter" value="14" className="mr-2" />
                        <span>14mm (max 80m)</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="diameter" value="16" defaultChecked className="mr-2" />
                        <span>16mm (max 100m)</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="diameter" value="20" className="mr-2" />
                        <span>20mm (max 120m)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rozstaw rur:
                    </label>
                    <div className="space-y-1">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>10cm (strefy brzegowe)</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>15cm</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        <span>20cm (standard)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wzór układania:
                    </label>
                    <div className="space-y-1">
                      <label className="flex items-center">
                        <input type="radio" name="pattern" value="spiral" defaultChecked className="mr-2" />
                        <span>Spirala</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="pattern" value="meander" className="mr-2" />
                        <span>Meandr</span>
                      </label>
                    </div>
                  </div>

                  <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold">
                    GENERUJ PĘTLE
                  </button>
                </div>
              </div>

              {/* Wyniki */}
              <div>
                <h3 className="text-lg font-semibold mb-3">📊 Wyniki</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pętle:</span>
                    <span className="font-semibold">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rura:</span>
                    <span className="font-semibold">- m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Powierzchnia:</span>
                    <span className="font-semibold">- m²</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Canvas Area */}
          <main className="col-span-9 space-y-6">
            {/* Canvas */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    Kliknij "Wczytaj JPG" aby rozpocząć
                  </p>
                  <p className="text-xs text-gray-500">
                    lub przeciągnij plik z rzutem pomieszczenia
                  </p>
                </div>
              </div>
            </div>

            {/* Podsumowanie */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📋 Podsumowanie</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Powierzchnia:</span>
                  <span className="ml-2 font-semibold">- m²</span>
                </div>
                <div>
                  <span className="text-gray-600">Ogrzewane:</span>
                  <span className="ml-2 font-semibold">- m² (--%)</span>
                </div>
                <div>
                  <span className="text-gray-600">Długość rur:</span>
                  <span className="ml-2 font-semibold">- m</span>
                </div>
                <div>
                  <span className="text-gray-600">Liczba pętli:</span>
                  <span className="ml-2 font-semibold">-</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
