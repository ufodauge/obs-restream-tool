## TODO

- storage 機能を atom で管理
- 正直 compaction がキモい
  - static に重なったときに移動してしまう
- panel list をコンパクトにして、scrollable に
- ステートの変更でかなりの再レンダリングが走っている
- ステートの変更と localhost へのコミットは分けたい
  - 一方で他所からのステートの変更は検知したい？　通知を受けて更新を確認する？
