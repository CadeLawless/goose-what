require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "WhatzItLiveOverlay"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/openai/whatz-it"
  s.license      = package["license"]
  s.authors      = "WHATZ IT"

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/openai/whatz-it.git", :tag => "#{s.version}" }
  s.source_files = ["ios/**/*.{h,m,mm,swift}"]
  s.frameworks   = ["AVFoundation", "CoreImage", "CoreMedia", "CoreVideo", "UIKit"]

  load "nitrogen/generated/ios/WhatzItLiveOverlay+autolinking.rb"
  add_nitrogen_files(s)

  s.dependency "VisionCamera"
  s.dependency "React-jsi"
  s.dependency "React-callinvoker"
  install_modules_dependencies(s)
end
