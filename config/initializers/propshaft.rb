# Configure Propshaft compilers
Rails.application.config.assets.compilers << ['text/javascript', Propshaft::Compiler::SourceMappingUrls]

# Add terser for JavaScript minification in production
if Rails.env.production?
  require 'terser'
  
  class TerserCompiler < Propshaft::Compiler
    def compile(logical_path, input)
      path_str = logical_path.to_s
      if path_str.end_with?('.js') && !path_str.include?('.min')
        Terser.new(compress: true, mangle: true).compile(input)
      else
        input
      end
    end
  end
  
  Rails.application.config.assets.compilers << ['text/javascript', TerserCompiler]
end