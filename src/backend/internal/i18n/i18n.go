// Package i18n gives the Go side of the app access to the same translations as
// the frontend. The locale files under locales/ are generated from
// src/frontend/svelte/core/i18n/locales by utils/i18n-generate.ts, so English
// stays the single source of truth for every string.
package i18n

import (
	"embed"
	"encoding/json"
	"os"
	"path"
	"regexp"
	"strings"
	"sync"
)

//go:embed locales/*.json
var localeFiles embed.FS

const fallbackLanguage = "en"

// Same marker the frontend strips: keys copied from English but not translated
// yet are prefixed with [NYT_<LANG>] by the generator.
var notYetTranslated = regexp.MustCompile(`^\[NYT_[A-Z]+\]\s*`)

var (
	loadOnce     sync.Once
	dictionaries map[string]map[string]any
)

func load() {
	loadOnce.Do(func() {
		dictionaries = make(map[string]map[string]any)

		entries, err := localeFiles.ReadDir("locales")
		if err != nil {
			return
		}

		for _, entry := range entries {
			if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
				continue
			}

			data, err := localeFiles.ReadFile(path.Join("locales", entry.Name()))
			if err != nil {
				continue
			}

			var dictionary map[string]any
			if err := json.Unmarshal(data, &dictionary); err != nil {
				continue
			}

			dictionaries[strings.TrimSuffix(entry.Name(), ".json")] = dictionary
		}
	})
}

// Available reports whether translations are shipped for the given language.
func Available(language string) bool {
	load()
	_, ok := dictionaries[language]
	return ok
}

// Detect picks the best shipped language for the current session, matching the
// primary subtag of the usual locale variables. Falls back to English.
func Detect() string {
	for _, variable := range []string{"LC_ALL", "LC_MESSAGES", "LANG"} {
		value := os.Getenv(variable)
		if value == "" {
			continue
		}

		primary := strings.ToLower(value)
		primary = strings.FieldsFunc(primary, func(r rune) bool {
			return r == '_' || r == '.' || r == '-' || r == '@'
		})[0]

		if Available(primary) {
			return primary
		}
	}

	return fallbackLanguage
}

// T returns the translation of a dotted key ("menu.show") in the given
// language, falling back to English and finally to the key itself.
func T(language string, key string) string {
	load()

	if text, ok := resolve(dictionaries[language], key); ok {
		return text
	}
	if text, ok := resolve(dictionaries[fallbackLanguage], key); ok {
		return text
	}
	return key
}

func resolve(dictionary map[string]any, key string) (string, bool) {
	var current any = dictionary

	for _, part := range strings.Split(key, ".") {
		node, ok := current.(map[string]any)
		if !ok {
			return "", false
		}
		current, ok = node[part]
		if !ok {
			return "", false
		}
	}

	text, ok := current.(string)
	if !ok {
		return "", false
	}
	return notYetTranslated.ReplaceAllString(text, ""), true
}
