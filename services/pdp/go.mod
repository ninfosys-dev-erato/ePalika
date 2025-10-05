module git.ninjainfosys.com/ePalika/services/pdp

go 1.25.1

replace git.ninjainfosys.com/ePalika/proto => ../../proto

require (
	git.ninjainfosys.com/ePalika/proto v0.0.0-00010101000000-000000000000
	google.golang.org/grpc v1.75.1
	google.golang.org/protobuf v1.36.10
)

require (
	golang.org/x/net v0.44.0 // indirect
	golang.org/x/sys v0.36.0 // indirect
	golang.org/x/text v0.29.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20250707201910-8d1bb00bc6a7 // indirect
)
