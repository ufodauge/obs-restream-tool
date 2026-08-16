// vitest の setupFiles で一度だけ読み込まれる。
//
// panels.ts / obsSyncSettings.ts は atomWithValidatedStorage({ getOnInit: true })
// を使っているため、モジュールの import 時点（トップレベル）で
// localStorage.getItem を同期的に呼ぶ。obsConnection.ts は
// selectEnabledPanelsWithSlotIndex を実値 import しているので、
// obsConnection.ts を import するだけで panels.ts のトップレベルが走り、
// jsdom を使わない素の Node 環境では localStorage が存在せず即座に
// ReferenceError になる。
//
// このテストスイートは実際の localStorage の中身には興味がない
// （sync() には panels/settings をテストコードから直接渡すので、
// atom 経由の永続化は経路として通らない）ため、フル機能の jsdom を
// 足す代わりに「呼ばれても壊れない」最小限のインメモリ実装だけを
// 用意する。
class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) ?? null) : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

if (typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    writable: true,
  });
}
