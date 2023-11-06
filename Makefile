IMAGE?=metaprov/llmdash-extension
TAG?=latest

BUILDER=buildx-multi-arch

STATIC_FLAGS=CGO_ENABLED=0
LDFLAGS="-s -w"
GO_BUILD=$(STATIC_FLAGS) go build -trimpath -ldflags=$(LDFLAGS)
OUT?=bin/service

INFO_COLOR = \033[0;36m
NO_COLOR   = \033[m

bin: ## Build the binary for the current platform
	@echo "$(INFO_COLOR)Building...$(NO_COLOR)"
	$(GO_BUILD) -o $(OUT) ./vm

build-extension: ## Build service image to be deployed as a desktop extension
	docker build --tag=$(IMAGE):$(TAG) .

build-extension-backend: ## Build extension backend image for testingt
	docker build --tag=$(IMAGE):$(TAG) .

remove-extension: ## Uninstall the extension
	docker extension rm $(IMAGE):$(TAG)

install-extension: build-extension ## Install the extension
	docker extension install $(IMAGE):$(TAG)

update-extension: build-extension ## Update the extension
	docker extension update $(IMAGE):$(TAG)

prepare-buildx: ## Create buildx builder for multi-arch build, if not exists
	docker buildx inspect $(BUILDER) || docker buildx create --name=$(BUILDER) --driver=docker-container --driver-opt=network=host

push-extension: prepare-buildx ## Build & Upload extension image to hub. Do not push if tag already exists: make push-extension tag=0.1
	docker pull $(IMAGE):$(TAG) && echo "Failure: Tag already exists" || docker buildx build --push --builder=$(BUILDER) --platform=linux/amd64,linux/arm64 --build-arg TAG=$(TAG) --tag=$(IMAGE):$(TAG) .

help: ## Show this help
	@echo Please specify a build target. The choices are:
	@grep -E '^[0-9a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(INFO_COLOR)%-30s$(NO_COLOR) %s\n", $$1, $$2}'

enable-debug: ## Enable extension debug
	docker extension dev ui-source metaprov/llmdash-extension http://localhost:3000
	docker extension dev debug metaprov/llmdash-extension

.PHONY: bin extension push-extension help
