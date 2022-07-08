$(function () {

	const tableName = $('#tableName')
	const column = $("#column")
	const dataType = $("#dataType")
	const PK = $("#PK")
	const NN = $("#NN")
	const UQ = $("#UQ")
	const FK = $("#FK")
	const FKTable = $("#FKTable")
	const FKColumn = $("#FKColumn")
	const circle = "◯"
	const removeButton = '<button class="remove btn btn-danger btn-sm">削除</button>'
	const SqlTable = $("#SqlTable")
	const resultArea = $("#resultArea")

	// 表の並べ替え
	$('tbody').sortable({
		update: (e, u) => popSql()
	})

	// 表に要素追加
	$('#addButton').click(function () {
		const cName = column.val()
		const dType = dataType.val()
		if (cName === "" || dType === "") {
			// カラム名かデータタイプが未入力なら表に追加しない
			return
		}
		const pk = PK.prop("checked") ? circle : ""
		const nn = NN.prop("checked") && !pk ? circle : ""
		const uq = UQ.prop("checked") && !pk ? circle : ""
		const fk = FK.prop("checked") ? circle : ""
		let FKInfo = ""
		if (fk === circle) {
			// リファレンスキーである
			const fkTable = FKTable.val()
			const fkColumn = FKColumn.val()
			if (fkTable === "" || fkColumn === "") {
				// 参照先が未入力なら表に追加しない
				return
			}
			FKInfo = `${fkTable}=>${fkColumn}`
		}
		const tags = [cName, dType, pk, nn, uq, fk, FKInfo, removeButton]
		SqlTable.append('<tr><td>' + tags.join("</td><td>") + '</td></tr>');

		popSql()
	});

	// 表の要素削除機能
	$(document).on('click', '.remove', function () {
		$(this).parents('tr').remove();
		popSql()
		return false
	})

	// 表をクリックしたら要素を入力欄に複写
	$(document).on('click', '#SqlTable tr', function () {
		const tableRow = $(this).children("td")

		column.val(tableRow.eq(0).text())
		dataType.val(tableRow.eq(1).text())
		NN.prop("checked", tableRow.eq(3).text() === circle)
		UQ.prop("checked", tableRow.eq(4).text() === circle)


		//外部キー制約のチェック
		if (tableRow.eq(5).text() === circle) {
			const references = tableRow.eq(6).text().split("=>")
			FK.prop("checked", true)
			FKTable.val(references[0])
			FKColumn.val(references[1])
		} else {
			FK.prop("checked", false)
		}

		// 主キー制約のチェック
		PK.prop("checked", tableRow.eq(2).text() === circle)

		// リファレンスキーの設定
		FKButton()

		// 主キーのボタン設定
		PKButton()
	})

	// FKボタンに応じてボタンの無効化をする
	function FKButton(){
		let checked = FK.prop("checked")
		FKColumn.prop('disabled', !checked);
		FKTable.prop('disabled', !checked);
	}

	// PPボタンに応じてボタンの無効化をする
	function PKButton() {
		checked = PK.prop("checked")
		UQ.prop('disabled', checked);
		NN.prop('disabled', checked);
	}

	// リファレンスキーの設定
	FK.click(FKButton)

	// 主キーの設定
	PK.click(PKButton)

	// テーブル名変更でSQL文生成
	tableName.keydown(() => setTimeout(popSql,0))

	// コピーボタン
	$("#copyButton").click(() => {
		navigator.clipboard.writeText(resultArea.html().replaceAll("<br>","\n").replaceAll(/(<([^>]+)>)/gi, '').replaceAll("&nbsp;"," "))
	})

	// createくりえいたー
	function createSql() {
		const sql = { columns: [], pks: [], fkFlg: false, tableName: tableName.val() }
		if (sql.tableName === "") {
			sql.tableName = "テーブル名"
		}
		// 表から情報の取得
		SqlTable.children("tr").each(function () {
			const tableRow = $(this).children("td")
			const sqlRow = {
				column: tableRow.eq(0).text(),
				dataType: tableRow.eq(1).text(),
				nn: (tableRow.eq(3).text() === circle),
				uq: (tableRow.eq(4).text() === circle)
			}

			//外部キー制約のチェック
			if (tableRow.eq(5).text() === circle) {
				const references = tableRow.eq(6).text().split("=>")
				sqlRow.fkFlg = true
				sqlRow.fTable = references[0]
				sqlRow.fColumn = references[1]
			}

			// 主キー制約のチェック
			if (tableRow.eq(2).text() === circle) {
				sql.pks.push(sqlRow.column)
			}

			sql.columns.push(sqlRow)
		})

		// 文の構築
		const indent = "&nbsp;&nbsp;&nbsp;&nbsp;"
		let sqlTexts = [`<span class="cm-keyword">CREATE TABLE IF NOT EXISTS</span> ${sql.tableName}(`]
		const keyword = str => `<span class="cm-keyword">${str}</span>`
		const builtin = str => `<span class="cm-builtin">${str}</span>`

		function orTrue(bool, trueVal) {
			return bool ? trueVal : ""
		}
		//カラムの出力
		const nn = `${keyword('NOT')} ${builtin('NULL')} `
		const uq = `${keyword('UNIQUE')} `
		const columns = []
		sql.columns.forEach(c => {
			let fk = ""
			// 外部キ－の作成
			if (c.fkFlg) {
				fk = `${keyword('REFERENCES')} ${c.fTable} (${c.fColumn})`
			}
			columns.push(`${indent}${c.column} ${builtin(c.dataType)} ${orTrue(c.uq, uq)}${orTrue(c.nn, nn)}${fk}`.trimEnd())
		})
		sqlTexts.push(columns.join(",<br>") + (sql.pks.length ? "," : ""))

		//主キーの出力
		if (sql.pks.length) {
			sqlTexts.push(`${indent}${keyword('PRIMARY KEY')}(${sql.pks.join(", ")})`)
		}

		sqlTexts.push(")")

		return sqlTexts.join("<br>")
	}

	//SQL文の生成と反映
	function popSql() {
		const sql = createSql()
		resultArea.html(sql)
	}

	popSql()
})
