export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          結婚式クイズアプリ
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <a
            href="/participant"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              参加者用
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              クイズに参加する
            </p>
          </a>

          <a
            href="/admin"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              管理者用
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              クイズを管理する
            </p>
          </a>

          <a
            href="/presentation"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              プレゼンテーション
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              会場スクリーンに表示
            </p>
          </a>
        </div>
      </div>
    </main>
  )
}