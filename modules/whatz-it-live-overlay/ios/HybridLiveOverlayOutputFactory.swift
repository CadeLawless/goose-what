import Foundation

final class HybridLiveOverlayOutputFactory: HybridLiveOverlayOutputFactorySpec {
  func createLiveOverlayOutput() throws -> any HybridLiveOverlayOutputSpec {
    HybridLiveOverlayOutput()
  }
}
