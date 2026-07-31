// sidebar.js — componente único do menu lateral OSPA Compat
// Uso em qualquer página:
//   <div id="ospa-sidebar"></div>
//   <script src="sidebar.js"></script>
// A página define, antes do script (ou via atributos no body):
//   <body data-page="documentos" data-projeto="02139SJD">

const OSPA_LOGO = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIyIiBoZWlnaHQ9IjkxIiB2aWV3Qm94PSIwIDAgMTIyIDkxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTkuOTUxOCAxMS41NjkzQzE5Ljk1MTggOC44NjE0NiAxNy43NTY2IDYuNjY2MzMgMTUuMDQ4OCA2LjY2NjMzSDExLjU2OTNDOC44NjE0NiA2LjY2NjMzIDYuNjY2MzMgOC44NjE0NiA2LjY2NjMzIDExLjU2OTNWNDYuNjgwOEM2LjY2NjMzIDQ5LjM4ODYgOC44NjE0NiA1MS41ODM3IDExLjU2OTMgNTEuNTgzN0gxNS4wNDg4QzE3Ljc1NjYgNTEuNTgzNyAxOS45NTE4IDQ5LjM4ODYgMTkuOTUxOCA0Ni42ODA4VjExLjU2OTNaTTI1Ljk2MTggNDYuNjgwOEMyNS45NjE4IDUyLjcwNzkgMjEuMDc1OSA1Ny41OTM4IDE1LjA0ODggNTcuNTkzOEgxMS41NjkzQzUuNTQyMTggNTcuNTkzOCAwLjY1NjI1IDUyLjcwNzkgMC42NTYyNSA0Ni42ODA4VjExLjU2OTNDMC42NTYyNSA1LjU0MjE4IDUuNTQyMTggMC42NTYyNSAxMS41NjkzIDAuNjU2MjVIMTUuMDQ4OEMyMS4wNzU5IDAuNjU2MjUgMjUuOTYxOCA1LjU0MjE4IDI1Ljk2MTggMTEuNTY5M1Y0Ni42ODA4WiIgZmlsbD0iIzE5MTkxOSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEwOS45NDUgMC42NTYyNUMxMTUuOTcyIDAuNjU2MjUgMTIwLjg1OCA1LjU0MjE4IDEyMC44NTggMTEuNTY5M1Y1Ny4xMTkzQzEyMC44NTggNTcuMzgxNCAxMjAuNjQ2IDU3LjU5MzggMTIwLjM4NCA1Ny41OTM4SDExNS4zMjNDMTE1LjA2MSA1Ny41OTM4IDExNC44NDggNTcuMzgxNCAxMTQuODQ4IDU3LjExOTNWNDYuNjAxN0MxMTQuODQ4IDQ2LjQ3MDcgMTE0Ljc0MiA0Ni4zNjQ1IDExNC42MTEgNDYuMzY0NUgxMDEuOEMxMDEuNjY5IDQ2LjM2NDUgMTAxLjU2MyA0Ni40NzA3IDEwMS41NjMgNDYuNjAxN1Y1Ny4xMTkzQzEwMS41NjMgNTcuMzgxNCAxMDEuMzUgNTcuNTkzOCAxMDEuMDg4IDU3LjU5MzhIOTYuMDI3MkM5NS43NjUyIDU3LjU5MzggOTUuNTUyNyA1Ny4zODE0IDk1LjU1MjcgNTcuMTE5M1YxMS41NjkzQzk1LjU1MjcgNS41NDIxOCAxMDAuNDM5IDAuNjU2MjUgMTA2LjQ2NiAwLjY1NjI1SDEwOS45NDVaTTEwNi40NjYgNi42NjYzM0MxMDMuNzU4IDYuNjY2MzMgMTAxLjU2MyA4Ljg2MTQ2IDEwMS41NjMgMTEuNTY5M1Y0MC4xMTcyQzEwMS41NjMgNDAuMjQ4MiAxMDEuNjY5IDQwLjM1NDQgMTAxLjggNDAuMzU0NEgxMTQuNjExQzExNC43NDIgNDAuMzU0NCAxMTQuODQ4IDQwLjI0ODIgMTE0Ljg0OCA0MC4xMTcyVjExLjU2OTNDMTE0Ljg0OCA4Ljg2MTQ2IDExMi42NTMgNi42NjYzMyAxMDkuOTQ1IDYuNjY2MzNIMTA2LjQ2NloiIGZpbGw9IiMxOTE5MTkiLz4KPHBhdGggZD0iTTU3LjU5NDcgNDYuNjgwOEM1Ny41OTQ3IDUyLjcwNzkgNTIuNzA4NyA1Ny41OTM4IDQ2LjY4MTYgNTcuNTkzOEg0My4yMDIxQzM3LjE3NSA1Ny41OTM4IDMyLjI4OTEgNTIuNzA3OSAzMi4yODkxIDQ2LjY4MDhWMzguNjE0NkMzMi4yODkxIDM4LjM1MjYgMzIuNTAxNSAzOC4xNDAyIDMyLjc2MzUgMzguMTQwMkgzNy44MjQ3QzM4LjA4NjcgMzguMTQwMiAzOC4yOTkxIDM4LjM1MjYgMzguMjk5MSAzOC42MTQ2VjQ2LjY4MDhDMzguMjk5MSA0OS4zODg2IDQwLjQ5NDMgNTEuNTgzNyA0My4yMDIxIDUxLjU4MzdINDYuNjgxNkM0OS4zODk0IDUxLjU4MzcgNTEuNTg0NiA0OS4zODg2IDUxLjU4NDYgNDYuNjgwOFYzNy4wMzNDNTEuNTg0NiAzNC4zNjc1IDQ5LjQ1NzYgMzIuMTk4OCA0Ni44MDgzIDMyLjEzMTZMNDMuMjAyMSAzMi4xMzAxQzM3LjI2OTIgMzIuMTMwMSAzMi40NDIyIDI3LjM5NTcgMzIuMjkyOCAyMS40OTg4TDMyLjI4OTEgMTEuNTY5M0MzMi4yODkxIDUuNTQyMTggMzcuMTc1IDAuNjU2MjUgNDMuMjAyMSAwLjY1NjI1SDQ2LjY4MTZDNTIuNzA4NyAwLjY1NjI1IDU3LjU5NDcgNS41NDIxOCA1Ny41OTQ3IDExLjU2OTNWMTkuNjM1NEM1Ny41OTQ3IDE5Ljg5NzUgNTcuMzgyMiAyMC4xMDk5IDU3LjEyMDIgMjAuMTA5OUg1Mi4wNTkxQzUxLjc5NyAyMC4xMDk5IDUxLjU4NDYgMTkuODk3NSA1MS41ODQ2IDE5LjYzNTRWMTEuNTY5M0M1MS41ODQ2IDguODYxNDYgNDkuMzg5NCA2LjY2NjMzIDQ2LjY4MTYgNi42NjYzM0g0My4yMDIxQzQwLjQ5NDMgNi42NjYzMyAzOC4yOTkxIDguODYxNDYgMzguMjk5MSAxMS41NjkzVjIxLjIxN0MzOC4yOTkxIDIzLjkyNDkgNDAuNDk0MyAyNi4xMiA0My4yMDIxIDI2LjEySDQ2LjY4MTZDNTIuNzA4NyAyNi4xMiA1Ny41OTQ3IDMxLjAwNTkgNTcuNTk0NyAzNy4wMzNWNDYuNjgwOFoiIGZpbGw9IiMxOTE5MTkiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04OS4yMjE4IDM1LjczMzJDODkuMDcyNCA0MS42MzAxIDg0LjI0NTQgNDYuMzY0NSA3OC4zMTI1IDQ2LjM2NDVINzAuMTY3MkM3MC4wMzYyIDQ2LjM2NDUgNjkuOTMgNDYuNDcwNyA2OS45MyA0Ni42MDE3VjU3LjExOTNDNjkuOTMgNTcuMzgxNCA2OS43MTc2IDU3LjU5MzggNjkuNDU1NSA1Ny41OTM4SDY0LjM5NDRDNjQuMTMyNCA1Ny41OTM4IDYzLjkxOTkgNTcuMzgxNCA2My45MTk5IDU3LjExOTNWMTEuNTY5M0M2My45MTk5IDUuNTQyMTggNjguODA1OSAwLjY1NjI1IDc0LjgzMyAwLjY1NjI1SDc4LjMxMjVDODQuMzM5NiAwLjY1NjI1MSA4OS4yMjU1IDUuNTQyMTggODkuMjI1NSAxMS41NjkzTDg5LjIyMTggMzUuNzMzMlpNODMuMjE1NCAxMS41NjkzQzgzLjIxNTQgOC44NjE0NiA4MS4wMjAzIDYuNjY2MzMgNzguMzEyNSA2LjY2NjMzSDc0LjgzM0M3Mi4xMjUxIDYuNjY2MzMgNjkuOTMgOC44NjE0NiA2OS45MyAxMS41NjkzVjQwLjExNzFDNjkuOTMgNDAuMjQ4MSA3MC4wMzYyIDQwLjM1NDQgNzAuMTY3MyA0MC4zNTQzTDc4LjQzOTEgNDAuMzUyOEM4MS4wODg0IDQwLjI4NTcgODMuMjE1NCAzOC4xMTY5IDgzLjIxNTQgMzUuNDUxNFYxMS41NjkzWiIgZmlsbD0iIzE5MTkxOSIvPgo8cGF0aCBkPSJNMTA4LjMwNCA3Mi4wOTM4SDEwOC45MjRWNzQuMjUwNUgxMDcuODE5QzEwNC45MzQgNzQuMjUwNSAxMDQuMTUyIDc2LjY0OTkgMTA0LjE1MiA3OC44MzM2Vjg1Ljg0MzFIMTAxLjk0MVY3Mi4wOTM4SDEwNC4xNTJWNzQuMTY5NkMxMDQuNzk5IDczLjExODIgMTA1Ljg1MSA3Mi4wOTM4IDEwOC4zMDQgNzIuMDkzOFoiIGZpbGw9IiMxOTE5MTkiLz4KPHBhdGggZD0iTTk3Ljg4NTUgNzguOTY4NFY3Mi4wOTM4SDEwMC4wOTZWODUuODQzMUg5Ny44ODU1Vjg0LjAwOThDOTcuMDc2NyA4NS4wMzQzIDk1Ljc1NTcgODYuMDA0OCA5My40OTExIDg2LjAwNDhDOTAuNDcxNyA4Ni4wMDQ4IDg4LjA3MjMgODQuMzA2NCA4OC4wNzIzIDc5Ljc1MDJWNzIuMDkzOEg5MC4yODI5Vjc5LjYxNTRDOTAuMjgyOSA4Mi40NzMyIDkxLjU3NyA4My45ODI5IDkzLjg2ODYgODMuOTgyOUM5Ni4zNzU4IDgzLjk4MjkgOTcuODg1NSA4Mi4wNjg4IDk3Ljg4NTUgNzguOTY4NFoiIGZpbGw9IiMxOTE5MTkiLz4KPHBhdGggZD0iTTgwLjI0IDgyLjI1NThWNzQuMTE0SDc3Ljc1OThWNzIuMDkyMUg4MC4yNFY2OC42NjAySDgyLjQ1MDdWNzIuMDkyMUg4Ni4wMDk0Vjc0LjExNEg4Mi40NTA3VjgyLjIyODlDODIuNDUwNyA4My4zODgxIDgyLjg1NTEgODMuODE5NSA4NC4wNDEzIDgzLjgxOTVIODYuMjI1Vjg1Ljg0MTRIODMuODI1NkM4MS4xODM2IDg1Ljg0MTQgODAuMjQgODQuNjgyMiA4MC4yNCA4Mi4yNTU4WiIgZmlsbD0iIzE5MTkxOSIvPgo8cGF0aCBkPSJNNzAuODQ4MSA4Ni4wMDQ1QzY2LjcyMzMgODYuMDA0NSA2NC4wMjczIDgzLjE3MzcgNjQuMDI3MyA3OC45NjgxQzY0LjAyNzMgNzQuNzg5MyA2Ni42Njk0IDcxLjkzMTYgNzAuNTUxNSA3MS45MzE2Qzc0LjQzMzcgNzEuOTMxNiA3Ni45Njc5IDc0LjM4NSA3Ny4wNzU3IDc4LjQ1NThDNzcuMDc1NyA3OC43NTI0IDc3LjA0ODggNzkuMDc1OSA3Ny4wMjE4IDc5LjM5OTRINjYuMzQ1OVY3OS41ODgxQzY2LjQyNjcgODIuMjAzMiA2OC4wNzEzIDg0LjAzNjUgNzAuNjg2MyA4NC4wMzY1QzcyLjYyNzQgODQuMDM2NSA3NC4xMzcyIDgzLjAxMiA3NC41OTU1IDgxLjIzMjdINzYuODMzMUM3Ni4yOTM5IDgzLjk4MjUgNzQuMDI5MyA4Ni4wMDQ1IDcwLjg0ODEgODYuMDA0NVpNNjYuNDgwNyA3Ny41NjYySDc0LjcwMzNDNzQuNDg3NiA3NS4xOTM3IDcyLjg3MDEgNzMuODcyNyA3MC41Nzg1IDczLjg3MjdDNjguNTU2NSA3My44NzI3IDY2LjY5NjMgNzUuMzI4NSA2Ni40ODA3IDc3LjU2NjJaIiBmaWxsPSIjMTkxOTE5Ii8+CjxwYXRoIGQ9Ik01Ny4zNTUzIDgyLjI1NzlWNzQuMTE2MUg1NC44NzVWNzIuMDk0Mkg1Ny4zNTUzVjY4LjY1NDNINTkuNTY2VjcyLjA5NDJINjMuMTI0NlY3NC4xMTYxSDU5LjU2NlY4Mi4yMzA5QzU5LjU2NiA4My4zOTAyIDU5Ljk3MDMgODMuODIxNSA2MS4xNTY2IDgzLjgyMTVINjMuMzQwM1Y4NS44NDM1SDYwLjk0MDlDNTguMjk4OSA4NS44NDM1IDU3LjM1NTMgODQuNjg0MiA1Ny4zNTUzIDgyLjI1NzlaIiBmaWxsPSIjMTkxOTE5Ii8+CjxwYXRoIGQ9Ik01MS4wNzYyIDg1Ljg0MzFWNzIuMDkzOEg1My4yODY5Vjg1Ljg0MzFINTEuMDc2MloiIGZpbGw9IiMxOTE5MTkiLz4KPHBhdGggZD0iTTUxLjA3NjIgNjguNjU0M0g1My4yODdWNzAuNDkzOEg1MS4wNzYyVjY4LjY1NDNaIiBmaWxsPSIjMTkxOTE5Ii8+CjxwYXRoIGQ9Ik00Ni40NjE3IDc4Ljk2ODRWNzIuMDkzOEg0OC42NzI0Vjg1Ljg0MzFINDYuNDYxN1Y4NC4wMDk4QzQ1LjY1MjkgODUuMDM0MyA0NC4zMzE5IDg2LjAwNDggNDIuMDY3MyA4Ni4wMDQ4QzM5LjA0NzggODYuMDA0OCAzNi42NDg0IDg0LjMwNjQgMzYuNjQ4NCA3OS43NTAyVjcyLjA5MzhIMzguODU5MVY3OS42MTU0QzM4Ljg1OTEgODIuNDczMiA0MC4xNTMyIDgzLjk4MjkgNDIuNDQ0NyA4My45ODI5QzQ0Ljk1MiA4My45ODI5IDQ2LjQ2MTcgODIuMDY4OCA0Ni40NjE3IDc4Ljk2ODRaIiBmaWxsPSIjMTkxOTE5Ii8+CjxwYXRoIGQ9Ik0zMi43MjE0IDc0LjE5NjJWNzIuMDkzNEgzNC45MzIxVjkwLjk3OTVIMzIuNzIxNFY4My42MzIxQzMxLjgwNDggODQuODk5MiAzMC4zMjIgODYuMDA0NSAyOC4wMDM1IDg2LjAwNDVDMjQuMjAyMiA4Ni4wMDQ1IDIxLjM5ODQgODMuNDQzMyAyMS4zOTg0IDc4Ljk2ODFDMjEuMzk4NCA3NC43NjI0IDI0LjIwMjIgNzEuOTMxNiAyOC4wMDM1IDcxLjkzMTZDMzAuMzIyIDcxLjkzMTYgMzEuODg1NyA3Mi44NzUyIDMyLjcyMTQgNzQuMTk2MlpNMjguMjE5MiA4NC4wMzY1QzMwLjkxNTEgODQuMDM2NSAzMi43NDg0IDgxLjk2MDYgMzIuNzQ4NCA3OS4wMjJDMzIuNzQ4NCA3Ni4wMDI1IDMwLjkxNTEgNzMuODk5NyAyOC4yMTkyIDczLjg5OTdDMjUuNDk2MyA3My44OTk3IDIzLjY2MyA3NS45NzU2IDIzLjY2MyA3OC45NjgxQzIzLjY2MyA4MS45NjA2IDI1LjQ5NjMgODQuMDM2NSAyOC4yMTkyIDg0LjAzNjVaIiBmaWxsPSIjMTkxOTE5Ii8+CjxwYXRoIGQ9Ik0yMC40MzQ3IDcyLjA5MzhIMjEuMDU0OFY3NC4yNTA1SDE5Ljk0OTRDMTcuMDY0OCA3NC4yNTA1IDE2LjI4MjkgNzYuNjQ5OSAxNi4yODI5IDc4LjgzMzZWODUuODQzMUgxNC4wNzIzVjcyLjA5MzhIMTYuMjgyOVY3NC4xNjk2QzE2LjkzIDczLjExODIgMTcuOTgxNCA3Mi4wOTM4IDIwLjQzNDcgNzIuMDkzOFoiIGZpbGw9IiMxOTE5MTkiLz4KPHBhdGggZD0iTTEyLjM1NTUgODUuODQyN0gxMC4yNTI3VjgzLjcxMjlDOS4zODk5NyA4NC45NTMxIDguMDE1MDQgODYuMDA0NSA1LjY0MjYgODYuMDA0NUMyLjYyMzE0IDg2LjAwNDUgMC41NzQyMTkgODQuNDk0OCAwLjU3NDIxOSA4MS45ODc1QzAuNTc0MjE5IDc5LjIzNzcgMi40ODgzNCA3Ny43MDEgNi4xMDA5MiA3Ny43MDFIMTAuMTQ0OFY3Ni43NTc0QzEwLjE0NDggNzQuOTc4MSA4Ljg3Nzc0IDczLjg5OTcgNi43MjA5OCA3My44OTk3QzQuNzc5OSA3My44OTk3IDMuNDg1ODQgNzQuODE2MyAzLjIxNjI1IDc2LjIxODJIMS4wMDU1N0MxLjMyOTA4IDczLjUyMjMgMy41MTI4IDcxLjkzMTYgNi44Mjg4MiA3MS45MzE2QzEwLjMzMzYgNzEuOTMxNiAxMi4zNTU1IDczLjY4NCAxMi4zNTU1IDc2Ljg5MjJWODUuODQyN1pNMTAuMTQ0OCA4MC4yMzUyVjc5LjU2MTJINS44ODUyNEMzLjkxNzIgNzkuNTYxMiAyLjgxMTg2IDgwLjI4OTEgMi44MTE4NiA4MS44NTI3QzIuODExODYgODMuMjAwNyAzLjk3MTExIDg0LjExNzMgNS44MDQzNiA4NC4xMTczQzguNTU0MjMgODQuMTE3MyAxMC4xNDQ4IDgyLjUyNjcgMTAuMTQ0OCA4MC4yMzUyWiIgZmlsbD0iIzE5MTkxOSIvPgo8cGF0aCBkPSJNMTIxLjE4MiA4NS45NDA0SDExOS4wNzlWODMuODEwNkMxMTguMjE2IDg1LjA1MDcgMTE2Ljg0MSA4Ni4xMDIyIDExNC40NjkgODYuMTAyMkMxMTEuNDQ5IDg2LjEwMjIgMTA5LjQgODQuNTkyNCAxMDkuNCA4Mi4wODUyQzEwOS40IDc5LjMzNTMgMTExLjMxNSA3Ny43OTg2IDExNC45MjcgNzcuNzk4NkgxMTguOTcxVjc2Ljg1NUMxMTguOTcxIDc1LjA3NTcgMTE3LjcwNCA3My45OTczIDExNS41NDcgNzMuOTk3M0MxMTMuNjA2IDczLjk5NzMgMTEyLjMxMiA3NC45MTQgMTEyLjA0MiA3Ni4zMTU5SDEwOS44MzJDMTEwLjE1NSA3My42MTk5IDExMi4zMzkgNzIuMDI5MyAxMTUuNjU1IDcyLjAyOTNDMTE5LjE2IDcyLjAyOTMgMTIxLjE4MiA3My43ODE3IDEyMS4xODIgNzYuOTg5OFY4NS45NDA0Wk0xMTguOTcxIDgwLjMzMjhWNzkuNjU4OEgxMTQuNzExQzExMi43NDMgNzkuNjU4OCAxMTEuNjM4IDgwLjM4NjcgMTExLjYzOCA4MS45NTA0QzExMS42MzggODMuMjk4NCAxMTIuNzk3IDg0LjIxNSAxMTQuNjMxIDg0LjIxNUMxMTcuMzggODQuMjE1IDExOC45NzEgODIuNjI0NCAxMTguOTcxIDgwLjMzMjhaIiBmaWxsPSIjMTkxOTE5Ii8+Cjwvc3ZnPgo=";

// Itens de navegação — mudar aqui reflete em TODAS as páginas que incluem este arquivo.
// "roles" controla quem vê o link (ajustaremos quando entrarmos em permissões).
const OSPA_NAV_ITEMS = [
  { key: 'inicio',     label: 'Página inicial', href: 'home.html',   icon: 'ti-home',       roles: ['projetista','coordenador','admin'], needsId: true },
  { key: 'relatorio',  label: 'Relatório',   href: 'projeto.html',    icon: 'ti-file-text',  roles: ['projetista','coordenador','admin'], needsId: true },
  { key: 'documentos', label: 'Documentos',  href: 'documentos.html', icon: 'ti-folder',      roles: ['projetista','coordenador','admin'], needsId: true },
  { key: 'analises',   label: 'Monitor de Conflitos', href: 'analytics.html', icon: 'ti-chart-bar',   roles: ['projetista','coordenador','admin'], needsId: true },
  { key: 'divider' },
  { key: 'analise',    label: 'Análise',     href: 'analise.html',   icon: 'ti-list-check',  roles: ['coordenador','admin'], needsId: true },
  // Editor: continua sendo o "blob" independente que já existe hoje (gerado
  // via editor-launcher.js), sem sidebar, aberto em nova aba. Diferente dos
  // outros itens, não navega — dispara window.ospaOpenEditor() diretamente,
  // então a página precisa incluir <script src="editor-launcher.js"></script>.
  { key: 'editor',     label: 'Editor',      icon: 'ti-edit',        roles: ['coordenador','admin'], action: 'editor' },
  { key: 'admin',      label: 'Admin',       href: 'admin.html',     icon: 'ti-settings',    roles: ['admin'] },
];

function ospaRenderSidebar() {
  const mount = document.getElementById('ospa-sidebar');
  if (!mount) return;
  mount.classList.add('sidebar'); // garante o layout correto (altura, sticky, rodapé) sem depender da página host

  const currentPage = document.body.dataset.page || '';
  const projeto = document.body.dataset.projeto || '—';
  const userName = document.body.dataset.userName || '';
  const userRole = document.body.dataset.userRole || 'projetista'; // vem da sessão, por enquanto placeholder
  const userDisciplinas = (document.body.dataset.userDisciplinas || '').split(',').filter(Boolean);
  const orgLine = userDisciplinas.length ? userDisciplinas.join(' · ') : 'OSPA';

  const iniciais = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase();

  const navHtml = OSPA_NAV_ITEMS.map(item => {
    if (item.key === 'divider') return '<div class="nav-divider"></div>';
    if (!item.roles.includes(userRole)) return '';
    const active = item.key === currentPage ? ' active' : '';
    if (item.action) {
      return `<a href="#" class="nav-link${active}" data-action="${item.action}"><i class="ti ${item.icon}" aria-hidden="true"></i>${item.label}</a>`;
    }
    const target = item.target ? ` target="${item.target}" rel="noopener"` : '';
    const queryParts = [];
    if (item.extraQuery) queryParts.push(item.extraQuery);
    if (item.needsId && projeto && projeto !== '—') queryParts.push('id=' + encodeURIComponent(projeto));
    const href = queryParts.length ? `${item.href}?${queryParts.join('&')}` : item.href;
    return `<a href="${href}" class="nav-link${active}"${target}><i class="ti ${item.icon}" aria-hidden="true"></i>${item.label}</a>`;
  }).join('');

  mount.innerHTML = `
    <div class="sidebar-logo">
      <img src="${OSPA_LOGO}" alt="OSPA">
    </div>
    <div class="sidebar-body">
      <div class="sidebar-user">
        <div class="sidebar-avatar">${iniciais}</div>
        <div>
          <div class="name">${userName}</div>
          <div class="org">${orgLine}</div>
        </div>
      </div>
      <a href="index.html" class="sidebar-project">
        <span>${projeto}</span>
        <span class="chev">⇅</span>
      </a>
      <nav class="sidebar-nav">${navHtml}</nav>
      <div class="sidebar-footer">
        <a href="#" class="nav-link" id="ospa-logout-link"><i class="ti ti-logout" aria-hidden="true"></i>Sair</a>
      </div>
    </div>
  `;

  // Contrato: cada página que inclui o sidebar define window.ospaLogout = suaFuncaoDeLogout
  const logoutLink = document.getElementById('ospa-logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', e => {
      e.preventDefault();
      if (typeof window.ospaLogout === 'function') window.ospaLogout();
    });
  }

  // Editor: dispara window.ospaOpenEditor(projeto, papel) — função definida em
  // editor-launcher.js, incluído nas páginas que precisam do link Editor.
  // Trava o link enquanto a chamada está em andamento, pra clique repetido
  // (comum quando a geração do blob demora) não abrir várias janelas.
  const editorLink = mount.querySelector('[data-action="editor"]');
  if (editorLink) {
    editorLink.addEventListener('click', async e => {
      e.preventDefault();
      if (editorLink.dataset.loading === '1') return;
      if (typeof window.ospaOpenEditor !== 'function') {
        alert('Editor não disponível nesta página ainda.');
        console.error('ospaOpenEditor não está disponível — inclua editor-launcher.js nesta página.');
        return;
      }
      editorLink.dataset.loading = '1';
      const originalHtml = editorLink.innerHTML;
      editorLink.innerHTML = '<i class="ti ti-loader-2" aria-hidden="true"></i>Abrindo…';
      editorLink.style.pointerEvents = 'none';
      try {
        await window.ospaOpenEditor(projeto, userRole);
      } finally {
        editorLink.dataset.loading = '0';
        editorLink.innerHTML = originalHtml;
        editorLink.style.pointerEvents = '';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', ospaRenderSidebar);
