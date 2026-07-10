def test_auto_detect_bank_hdfc():
    from app.services.csv_import import auto_detect_bank, BANK_PRESETS
    headers = BANK_PRESETS["hdfc"]["header"]
    assert auto_detect_bank(headers) == "hdfc"


def test_auto_detect_bank_sbi():
    from app.services.csv_import import auto_detect_bank, BANK_PRESETS
    headers = BANK_PRESETS["sbi"]["header"]
    got = auto_detect_bank(headers)
    assert got is not None


def test_auto_detect_bank_icici():
    from app.services.csv_import import auto_detect_bank, BANK_PRESETS
    headers = BANK_PRESETS["icici"]["header"]
    got = auto_detect_bank(headers)
    assert got is not None


def test_auto_detect_bank_axis():
    from app.services.csv_import import auto_detect_bank, BANK_PRESETS
    headers = BANK_PRESETS["axis"]["header"]
    got = auto_detect_bank(headers)
    assert got is not None


def test_auto_detect_bank_kotak():
    from app.services.csv_import import auto_detect_bank, BANK_PRESETS
    headers = BANK_PRESETS["kotak"]["header"]
    got = auto_detect_bank(headers)
    assert got is not None


def test_parse_csv_with_debit_credit():
    from app.services.csv_import import parse_csv, BANK_PRESETS
    sbi = BANK_PRESETS["sbi"]
    header_str = ",".join(sbi["header"])
    csv = f"{header_str}\n15/03/2024,Amazon,12345,500,,10000\n"
    result = parse_csv(csv)
    assert len(result["rows"]) == 1
    assert result["rows"][0]["amount"] == 500.0
    assert result["rows"][0]["direction"] == "credit"


def test_parse_csv_withdrawal_deposit():
    from app.services.csv_import import parse_csv
    csv = "col1,col2,col3,col4,col5\n15/03/2024,Amazon,-500,100,600\n"
    result = parse_csv(csv)
    assert len(result["rows"]) == 1
    assert result["rows"][0]["amount"] == 500.0
    assert result["rows"][0]["direction"] == "debit"


def test_parse_csv_credit_deposit():
    from app.services.csv_import import parse_csv
    csv = "col1,col2,col3,col4,col5\n15/03/2024,Salary,100,500,600\n"
    result = parse_csv(csv)
    assert len(result["rows"]) == 1
    assert result["rows"][0]["amount"] == 100.0
    assert result["rows"][0]["direction"] == "debit"


def test_parse_csv_empty():
    from app.services.csv_import import parse_csv
    result = parse_csv("")
    assert result["bank_name"] == ""
    assert result["rows"] == []
    assert "Empty file" in result["errors"]


def test_parse_csv_bad_date():
    from app.services.csv_import import parse_csv, BANK_PRESETS
    icici = BANK_PRESETS["icici"]
    header_str = ",".join(icici["header"])
    csv = f"{header_str}\nbogus-date,Amazon,,500,,5000\n"
    result = parse_csv(csv)
    assert len(result["rows"]) == 0
    assert any("unparseable date" in e for e in result["errors"])


def test_parse_csv_zero_amount_skipped():
    from app.services.csv_import import parse_csv, BANK_PRESETS
    icici = BANK_PRESETS["icici"]
    header_str = ",".join(icici["header"])
    csv = f"{header_str}\n15/03/2024,Free,,-0,,5000\n"
    result = parse_csv(csv)
    assert len(result["rows"]) == 0


def test_parse_csv_generic():
    from app.services.csv_import import parse_csv
    csv = "col1,col2,col3,col4\n15/03/2024,Amazon,-500,100\n"
    result = parse_csv(csv)
    assert len(result["rows"]) == 1


def test_parse_csv_too_few_columns():
    from app.services.csv_import import parse_csv
    csv = "col1,col2\n15/03/2024,Amazon\n"
    result = parse_csv(csv)
    assert any("too few" in e for e in result["errors"])


def test_categorize_row_via_keywords_direct():
    from app.services.csv_import import categorize_row
    import app.services.csv_import as csv_mod
    original_fn = csv_mod.classify_expense
    csv_mod.classify_expense = lambda *a, **kw: (_ for _ in ()).throw(Exception("no ai"))
    assert csv_mod.categorize_row("Swiggy dinner order") == "Food & Dining"
    assert csv_mod.categorize_row("Amazon purchase") == "Shopping"
    assert csv_mod.categorize_row("netflix streaming") == "Entertainment"
    assert csv_mod.categorize_row("Unknown random item") == "Other"
    csv_mod.classify_expense = original_fn
