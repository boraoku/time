# Configure Propshaft compilers
Rails.application.config.assets.compilers << ['text/javascript', Propshaft::Compiler::SourceMappingUrls]

# Add terser for JavaScript minification in production
if Rails.env.production?
  require 'terser'
  
  class TerserCompiler < Propshaft::Compiler
    def compile(logical_path, input)
      if logical_path.extname == '.js' && !logical_path.to_s.include?('.min')
        Terser.new(compress: true, mangle: true).compile(input)
      else
        input
      end
    end
  end
  
  Rails.application.config.assets.compilers << ['text/javascript', TerserCompiler]
end