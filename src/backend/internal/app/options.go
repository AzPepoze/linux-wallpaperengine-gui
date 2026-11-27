package app

import "os"

type Options struct {
	Minimized bool
	Quit      bool
}

func ParseOptions() Options {
	return parseArguments(os.Args)
}

func parseArguments(arguments []string) Options {
	options := Options{}

	for _, argument := range arguments {
		switch argument {
		case "--minimized":
			options.Minimized = true
		case "--quit":
			options.Quit = true
		}
	}

	return options
}
