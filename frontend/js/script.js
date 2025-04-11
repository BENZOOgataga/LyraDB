document.getElementById('runQuery').addEventListener('click', function () {
    const sql = document.getElementById('sqlQuery').value;
    const errorBox = document.getElementById('errorBox');
    const resultTable = document.getElementById('resultTable');
    errorBox.style.display = 'none';
    fetch('query.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'sql=' + encodeURIComponent(sql)
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                errorBox.textContent = data.error;
                errorBox.style.display = 'block';
                resultTable.querySelector('thead').innerHTML = '';
                resultTable.querySelector('tbody').innerHTML = '';
            } else {
                renderTable(data.data);
            }
        })
        .catch(err => {
            errorBox.textContent = 'Request failed: ' + err;
            errorBox.style.display = 'block';
        });
});

function renderTable(data) {
    const tableHead = document.getElementById('resultTable').querySelector('thead');
    const tableBody = document.getElementById('resultTable').querySelector('tbody');
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    if (Array.isArray(data) && data.length > 0) {
        const headerRow = document.createElement('tr');
        Object.keys(data[0]).forEach(key => {
            const th = document.createElement('th');
            th.textContent = key;
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);

        data.forEach(row => {
            const tr = document.createElement('tr');
            Object.values(row).forEach(value => {
                const td = document.createElement('td');
                td.textContent = value;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    } else {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 1;
        td.textContent = 'No results';
        tr.appendChild(td);
        tableBody.appendChild(tr);
    }
}