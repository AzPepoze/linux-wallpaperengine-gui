package i18n

import "testing"

func TestTranslatesShippedLanguage(t *testing.T) {
	if got := T("ru", "tray.menu.quit"); got != "Выход" {
		t.Fatalf("ru tray.menu.quit = %q", got)
	}
}

func TestFallsBackToEnglish(t *testing.T) {
	if got := T("de", "tray.menu.show"); got != "Show" {
		t.Fatalf("missing language should fall back to English, got %q", got)
	}
}

func TestStripsNotYetTranslatedMarker(t *testing.T) {
	got := T("th", "tray.menu.show")
	if got != "Show" {
		t.Fatalf("untranslated string should be shown clean, got %q", got)
	}
}

func TestUnknownKeyReturnsKey(t *testing.T) {
	if got := T("en", "tray.menu.nope"); got != "tray.menu.nope" {
		t.Fatalf("unknown key = %q", got)
	}
}

func TestDetectMatchesPrimarySubtag(t *testing.T) {
	t.Setenv("LC_ALL", "")
	t.Setenv("LC_MESSAGES", "")
	t.Setenv("LANG", "ru_RU.UTF-8")
	if got := Detect(); got != "ru" {
		t.Fatalf("Detect() = %q, want ru", got)
	}

	t.Setenv("LANG", "de_DE.UTF-8")
	if got := Detect(); got != "en" {
		t.Fatalf("Detect() with unshipped language = %q, want en", got)
	}
}
