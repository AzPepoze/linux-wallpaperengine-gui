package app

import "os"

type Options struct {
	Minimized bool
}

func ParseOptions() Options {
	options := Options{
		Minimized: false,
	}

	for _, argument := range os.Args {
		if argument == "--minimized" {
			options.Minimized = true
			break
		}
	}

	return options
}
